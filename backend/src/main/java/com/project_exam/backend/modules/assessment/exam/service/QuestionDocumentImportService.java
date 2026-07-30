package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.NormalQuestionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageQuestionGroup;
import com.project_exam.backend.modules.assessment.exam.dto.PassageRequest;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.usermodel.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.zwobble.mammoth.DocumentConverter;
import org.zwobble.mammoth.Result;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuestionDocumentImportService {
    private static final Logger log = LoggerFactory.getLogger(QuestionDocumentImportService.class);

    private static final List<String> ALLOWED_LABELS = List.of("A", "B", "C", "D");

    private static final String ALLOWED_LABEL_CLASS = "[A-D]";

    private static final String QUESTION_KEYWORDS = "Câu|Question|Bài";

    private static final List<String> CORRECT_ANSWER_MARKERS = List.of("*");

    private static final int MAX_INLINE_OPTION_CHARS = 100;
    private static final int MAX_INLINE_OPTION_WORDS = 15;

    private static final int LOG_QUESTION_PREVIEW_LIMIT = 120;

    private static final long MAX_FILE_SIZE_BYTES = 20L * 1024 * 1024;

    private static final int MIN_FALLBACK_STYLED_RUN_LENGTH = 6;

    private static final List<String> SKIPPABLE_PREFIXES = List.of(
            "part ",
            "choose the correct answer",
            "choose a, b, c, or d",
            "i."
    );

    private static final List<String> SKIPPABLE_CONTAINS = List.of(
            "reading & writing",
            "pronunciation in the following questions"
    );

    private static final Pattern QUESTION_START_PATTERN = Pattern.compile(
            "^\\s*(?:(?:" + QUESTION_KEYWORDS + ")\\s*)?\\(?(\\d+)\\)?"
                    + "\\s*(?:(?:[\\.:\\-\\)]\\s*(.*))|(\\S.*))?\\s*$",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern QUESTION_KEYWORD_PREFIX_PATTERN = Pattern.compile(
            "^\\s*(?:" + QUESTION_KEYWORDS + ")\\s*\\(?\\d",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern OPTION_PATTERN = Pattern.compile(
            "^\\s*\\(?(" + ALLOWED_LABEL_CLASS + ")\\)?(?:\\s*[\\.\\):\\-](?![-_]{2,})|\\s+(?![-_]{2,}))\\s*(.*)$",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern OPTION_LABEL_START = Pattern.compile(
            "(?:^|\\s)\\s*\\(?(" + ALLOWED_LABEL_CLASS + ")\\)?\\s*[\\.\\):\\-](?![-_]{2,})(?![Mm]\\.)"
                    + "|(?:^|\\s{2,}|\\t)\\s*\\(?(" + ALLOWED_LABEL_CLASS + ")\\)?\\s+(?![-_]{2,})",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern SECTION_HEADING_OPTION_LIKE_PATTERN = Pattern.compile(
            "^" + ALLOWED_LABEL_CLASS + "\\.\\s*[A-Z][A-Z0-9\\s&/\\-,:]*$"
    );

    private static final Pattern PAGE_FOOTER_PATTERN =
            Pattern.compile("^\\s*trang\\s*\\d+\\s*/\\s*\\d+\\s*$", Pattern.CASE_INSENSITIVE);

    private static final Pattern EXAM_CODE_PATTERN =
            Pattern.compile("^\\s*m[aã]\\s*đ[ềe]\\s*\\d+\\s*$", Pattern.CASE_INSENSITIVE);

    private static final Pattern PASSAGE_START_PATTERN = Pattern.compile(
            "^\\s*(?:Passage|Bài\\s*đọc)\\s*(\\d+)?\\s*[:\\.\\-]?\\s*(.*)$",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern PASSAGE_SEGMENT_PATTERN = Pattern.compile(
            "^\\s*(?:Đoạn|Văn\\s*bản)\\s+(\\d+)\\s*[:\\.\\-]\\s*(.*)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern EXPLANATION_START_PATTERN = Pattern.compile(
            "^\\s*(?:Giải\\s*thích|Lời\\s*giải|Hướng\\s*dẫn|Explanation)\\s*[:\\.\\-]?\\s*(.*)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern TAGS_START_PATTERN = Pattern.compile(
            "^\\s*(?:Tags?|Thẻ|Nhãn)\\s*[:\\-]\\s*(.*)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern TRANSLATION_START_PATTERN = Pattern.compile(
            "^\\s*(?:Dịch(?:\\s*nghĩa)?|Bản\\s*dịch|Translation)\\s*[:\\.\\-]?\\s*(.*)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern WEIRD_WHITESPACE_PATTERN =
            Pattern.compile("[\\u00A0\\u200B\\u3000\\u202F]");

    private static final Pattern BULLET_LINE_PATTERN = Pattern.compile(
            "^[\\u2022\\u00B7\\u2023\\u25AA\\u25E6\\u25CB\\u25CF\\u2605\\u2606\\-*+]\\s+\\S.*$"
    );

    public List<NormalQuestionRequest> parseQuestionsFromDocument(MultipartFile file) throws IOException {
        validateFile(file);
        List<ParsedLine> allLines = extractLinesFromDoc(file);

        FlatQuestionCollector collector = new FlatQuestionCollector();
        new LineProcessor(collector).process(allLines);
        List<NormalQuestionRequest> parsedQuestions = collector.getResults();

        log.info(
                "Imported '{}' -> lines={}, questions={}",
                Optional.ofNullable(file.getOriginalFilename()).orElse("(unknown)"),
                allLines.size(),
                parsedQuestions.size()
        );
        return parsedQuestions;
    }

    public List<PassageQuestionGroup> parsePassageQuestionsFromDocument(MultipartFile file) throws IOException {
        validateFile(file);
        List<ParsedLine> allLines = extractLinesFromDoc(file);

        PassageGroupCollector collector = new PassageGroupCollector();
        new LineProcessor(collector).process(allLines);
        List<PassageQuestionGroup> parsedGroups = collector.getResults();

        log.info(
                "Imported Passage Document '{}' -> lines={}, groups={}",
                Optional.ofNullable(file.getOriginalFilename()).orElse("(unknown)"),
                allLines.size(),
                parsedGroups.size()
        );
        return parsedGroups;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException(
                    "File too large. Max size is " + (MAX_FILE_SIZE_BYTES / (1024 * 1024)) + "MB."
            );
        }
    }

    private List<ParsedLine> extractLinesFromDoc(MultipartFile file) throws IOException {
        String filename = Optional.ofNullable(file.getOriginalFilename())
                .orElse("")
                .toLowerCase(Locale.ROOT);
        byte[] bytes = file.getBytes();

        if (filename.endsWith(".docx")) {
            return extractFromDocx(bytes);
        }
        if (filename.endsWith(".doc")) {
            return extractFromLegacyDoc(bytes);
        }

        throw new IllegalArgumentException("Unsupported file type. Only .doc and .docx are accepted.");
    }

    private List<ParsedLine> extractFromDocx(byte[] bytes) throws IOException {

        List<Boolean> blankAfter = computeBlankAfterFlags(bytes);
        List<ParsedLine> mammothLines =
                extractLinesFromDocxWithMammoth(new ByteArrayInputStream(bytes), blankAfter);
        if (!mammothLines.isEmpty()) {
            return mammothLines;
        }
        List<ParsedLine> lines = new ArrayList<>();
        try (InputStream is = new ByteArrayInputStream(bytes);
             XWPFDocument docx = new XWPFDocument(is)) {
            extractLinesFromDocx(docx, lines);
        }
        return lines;
    }

    private List<Boolean> computeBlankAfterFlags(byte[] bytes) {
        List<Boolean> flags = new ArrayList<>();
        try (InputStream is = new ByteArrayInputStream(bytes);
             XWPFDocument docx = new XWPFDocument(is)) {
            for (XWPFParagraph para : docx.getParagraphs()) {
                String t = para.getParagraphText();
                boolean empty = t == null || t.trim().isEmpty();
                if (empty) {

                    if (!flags.isEmpty()) {
                        flags.set(flags.size() - 1, Boolean.TRUE);
                    }
                } else {
                    flags.add(Boolean.FALSE);
                }
            }
        } catch (Exception e) {
            log.warn("computeBlankAfterFlags failed, skip blank-line preservation: {}", e.getMessage());
            return List.of();
        }
        return flags;
    }

    private List<ParsedLine> extractFromLegacyDoc(byte[] bytes) throws IOException {

        List<ParsedLine> lines = new ArrayList<>();
        try (InputStream is = new ByteArrayInputStream(bytes);
             HWPFDocument doc = new HWPFDocument(is);
             WordExtractor extractor = new WordExtractor(doc)) {
            for (String paraText : extractor.getParagraphText()) {
                if (paraText == null) {
                    continue;
                }
                appendPlainLines(paraText, lines);
            }
        }
        return lines;
    }

    private List<ParsedLine> extractLinesFromDocxWithMammoth(InputStream is, List<Boolean> blankAfter) {
        try {
            DocumentConverter converter = new DocumentConverter();
            Result<String> result = converter.convertToHtml(is);
            String html = result.getValue();
            if (html == null || html.trim().isEmpty()) {
                return List.of();
            }
            Document dom = Jsoup.parse(html);
            Elements blocks = dom.select("p, li, td");
            List<ParsedLine> lines = new ArrayList<>();

            int nonEmptyBlockIdx = 0;
            for (Element block : blocks) {

                block.select("br").forEach(br -> br.replaceWith(new TextNode("\n")));
                String blockText = block.wholeText();
                if (blockText == null || blockText.trim().isEmpty()) {

                    addBlankMarker(lines);
                    continue;
                }

                Elements styledElements = block.select(
                        "strong, b, u, em, mark,"
                                + " span[style*=color],"
                                + " span[style*=background],"
                                + " span[style*=bold],"
                                + " span[style*=underline]"
                );
                String styledRawText = styledElements.text();
                String normalizedStyled = normalizeText(styledRawText);

                for (String logicalLine : blockText.split("\\R")) {
                    String cleanLine = cleanWhitespace(logicalLine);
                    if (cleanLine.isEmpty()) {

                        addBlankMarker(lines);
                        continue;
                    }
                    if (isBulletLine(cleanLine)) {
                        lines.add(new ParsedLine(cleanLine, false));
                        continue;
                    }
                    for (String seg : splitLineByOptionLabels(cleanLine)) {
                        String cleanSeg = seg.trim();
                        if (cleanSeg.isEmpty()) {
                            continue;
                        }
                        boolean isStyled = getOptionLabel(cleanSeg) != null
                                && isStyledByHtmlSegment(styledRawText, normalizedStyled, cleanSeg);
                        lines.add(new ParsedLine(cleanSeg, isStyled));
                    }
                }

                if (blankAfter != null && nonEmptyBlockIdx < blankAfter.size()
                        && Boolean.TRUE.equals(blankAfter.get(nonEmptyBlockIdx))) {
                    addBlankMarker(lines);
                }
                nonEmptyBlockIdx++;
            }
            return lines;
        } catch (Exception e) {

            log.warn("Mammoth docx->html failed, fallback to POI parser: {}", e.getMessage());
            return List.of();
        }
    }

    private boolean isStyledByHtmlSegment(String styledRawText,
                                          String normalizedStyledText,
                                          String segmentText) {
        if (styledRawText == null || styledRawText.isBlank()) {
            return false;
        }
        Matcher om = OPTION_PATTERN.matcher(segmentText);
        if (!om.matches()) {
            return false;
        }
        String label = om.group(1).toUpperCase(Locale.ROOT);
        String body = om.group(2) == null ? "" : om.group(2).trim();

        if (styledRawText.contains(label + ".")
                || styledRawText.contains(label + ")")
                || styledRawText.contains("(" + label + ")")
                || styledRawText.contains(label + ":")) {
            return true;
        }

        if (body.length() < 2) {
            return false;
        }
        String normalizedBody = normalizeText(body);
        if (normalizedBody.isEmpty()) {
            return false;
        }
        return normalizedStyledText.contains(normalizedBody);
    }

    private void addBlankMarker(List<ParsedLine> lines) {
        if (lines.isEmpty() || lines.get(lines.size() - 1).blank) {
            return;
        }
        lines.add(ParsedLine.blankMarker());
    }

    private void extractLinesFromDocx(XWPFDocument docx, List<ParsedLine> lines) {
        for (XWPFParagraph para : docx.getParagraphs()) {
            processParagraph(para, lines);
        }
        for (XWPFTable table : docx.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph cellPara : cell.getParagraphs()) {
                        processParagraph(cellPara, lines);
                    }
                }
            }
        }
    }

    private void processParagraph(XWPFParagraph para, List<ParsedLine> lines) {
        String text = para.getParagraphText();
        if (text == null || text.trim().isEmpty()) {

            addBlankMarker(lines);
            return;
        }
        for (String logicalLine : text.split("\\R")) {
            String cleanLine = cleanWhitespace(logicalLine);
            if (cleanLine.isEmpty()) {
                addBlankMarker(lines);
                continue;
            }
            if (isBulletLine(cleanLine)) {
                lines.add(new ParsedLine(cleanLine, false));
                continue;
            }
            for (String seg : splitLineByOptionLabels(cleanLine)) {
                String cleanSeg = seg.trim();
                if (cleanSeg.isEmpty()) {
                    continue;
                }
                boolean isStyled = getOptionLabel(cleanSeg) != null
                        && isOptionSegmentStyled(para, cleanSeg);
                lines.add(new ParsedLine(cleanSeg, isStyled));
            }
        }
    }

    private void appendPlainLines(String text, List<ParsedLine> lines) {
        if (text == null) {
            return;
        }
        if (text.trim().isEmpty()) {
            addBlankMarker(lines);
            return;
        }
        for (String logicalLine : text.split("\\R")) {
            String cleanLine = cleanWhitespace(logicalLine);
            if (cleanLine.isEmpty()) {
                addBlankMarker(lines);
                continue;
            }
            if (isBulletLine(cleanLine)) {
                lines.add(new ParsedLine(cleanLine, false));
                continue;
            }
            for (String seg : splitLineByOptionLabels(cleanLine)) {
                String clean = seg.trim();
                if (!clean.isEmpty()) {
                    lines.add(new ParsedLine(clean, false));
                }
            }
        }
    }

    private interface QuestionCollector {

        void emitQuestion(ParsedQuestion q);

        default void startPassage() {
        }

        default void setPassageContent(String content) {
        }

        default void setPassageTranslation(String translation) {
        }

        default void setPassageExtraContents(List<String> extraContents) {
        }

        default boolean supportsPassage() {
            return false;
        }
    }

    private class LineProcessor {
        private final QuestionCollector collector;

        private ParsedQuestion currentQuestion;
        private String lastLabel;

        private final StringBuilder pendingText = new StringBuilder();

        private final StringBuilder pendingTranslation = new StringBuilder();

        private final List<String> passageSegments = new ArrayList<>();
        private boolean inPassageHeader = false;

        private boolean inPassageTranslation = false;

        private boolean inExplanation = false;

        private boolean pendingExplanationBlank = false;

        private boolean pendingPassageBlank = false;

        LineProcessor(QuestionCollector collector) {
            this.collector = collector;
        }

        void process(List<ParsedLine> lines) {
            for (ParsedLine pl : lines) {
                handleLine(pl);
            }
            flushCurrentQuestion();

            if (collector instanceof PassageGroupCollector) {
                ((PassageGroupCollector) collector).finalizeLastGroup();
            }
        }

        private void handleLine(ParsedLine pl) {

            if (pl.blank) {
                if (inExplanation && currentQuestion != null
                        && currentQuestion.explanation != null
                        && !currentQuestion.explanation.isBlank()) {
                    pendingExplanationBlank = true;
                } else if (inPassageHeader) {

                    StringBuilder target = inPassageTranslation ? pendingTranslation : pendingText;
                    if (target.length() > 0) {
                        pendingPassageBlank = true;
                    }
                }
                return;
            }

            String text = pl.text;
            if (isSkippableLine(text)) {
                return;
            }

            if (collector.supportsPassage()) {
                Matcher pm = PASSAGE_START_PATTERN.matcher(text);
                if (pm.matches()) {
                    inExplanation = false;
                    flushCurrentQuestion();
                    collector.startPassage();
                    pendingText.setLength(0);
                    pendingTranslation.setLength(0);
                    passageSegments.clear();
                    inPassageTranslation = false;
                    pendingPassageBlank = false;
                    String extraText = pm.group(2);
                    if (extraText != null && !extraText.trim().isEmpty()) {
                        pendingText.append(extraText.trim());
                    }
                    inPassageHeader = true;
                    currentQuestion = null;
                    lastLabel = null;
                    return;
                }
            }

            Matcher qm = QUESTION_START_PATTERN.matcher(text);
            if (qm.matches()
                    && inPassageHeader
                    && !QUESTION_KEYWORD_PREFIX_PATTERN.matcher(text).find()) {
                handleContinuationLine(text);
                return;
            }
            if (qm.matches()) {
                inExplanation = false;
                if (inPassageHeader) {

                    finalizePassageSegments();
                    inPassageHeader = false;
                    inPassageTranslation = false;
                } else {
                    flushCurrentQuestion();
                }
                pendingText.setLength(0);
                pendingTranslation.setLength(0);
                pendingPassageBlank = false;
                currentQuestion = new ParsedQuestion(qm.group(1), extractQuestionText(qm));
                lastLabel = null;
                return;
            }

            if (inPassageHeader) {
                Matcher tm = TRANSLATION_START_PATTERN.matcher(text);
                if (tm.matches()) {
                    inPassageTranslation = true;

                    pendingPassageBlank = false;
                    String tail = tm.group(1) == null ? "" : tm.group(1).trim();
                    if (!tail.isEmpty()) {
                        if (pendingTranslation.length() > 0) {
                            pendingTranslation.append("\n");
                        }
                        pendingTranslation.append(tail);
                    }
                    return;
                }
            }

            if (inPassageHeader && !inPassageTranslation) {
                Matcher sm = PASSAGE_SEGMENT_PATTERN.matcher(text);
                if (sm.matches()) {
                    String seg = pendingText.toString().trim();
                    if (!seg.isEmpty()) {
                        passageSegments.add(seg);
                    }
                    pendingText.setLength(0);

                    pendingPassageBlank = false;
                    String tail = sm.group(2) == null ? "" : sm.group(2).trim();
                    if (!tail.isEmpty()) {
                        pendingText.append(tail);
                    }
                    return;
                }
            }

            if (currentQuestion != null && !inPassageHeader) {
                Matcher tagm = TAGS_START_PATTERN.matcher(text);
                if (tagm.matches()) {
                    String body = tagm.group(1) == null ? "" : tagm.group(1).trim();

                    for (String name : body.split(";")) {
                        String n = name.trim();
                        if (!n.isEmpty() && !currentQuestion.tagNames.contains(n)) {
                            currentQuestion.tagNames.add(n);
                        }
                    }
                    return;
                }
            }

            if (inExplanation && currentQuestion != null) {
                Matcher em = EXPLANATION_START_PATTERN.matcher(text);
                if (em.matches()) {

                    String tail = em.group(1) == null ? "" : em.group(1).trim();
                    if (!tail.isEmpty()) {
                        appendExplanation(tail);
                    }
                    return;
                }
                appendExplanation(text);
                return;
            }

            Matcher om = OPTION_PATTERN.matcher(text);
            if (om.matches() && currentQuestion != null && !inPassageHeader && !isSectionHeadingOptionLike(text)) {
                ParsedOption parsedOption = parseOptionText(om.group(2));
                if (isLikelyOptionLine(text, parsedOption.optionText)) {
                    handleOptionLine(om.group(1), parsedOption, pl.isStyled);
                    return;
                }
            }

            if (currentQuestion != null && !inPassageHeader && !currentQuestion.options.isEmpty()) {
                Matcher em = EXPLANATION_START_PATTERN.matcher(text);
                if (em.matches()) {
                    inExplanation = true;
                    pendingExplanationBlank = false;
                    String tail = em.group(1) == null ? "" : em.group(1).trim();
                    if (!tail.isEmpty()) {
                        appendExplanation(tail);
                    }
                    return;
                }
            }

            handleContinuationLine(text);
        }

        private void appendExplanation(String addition) {
            String separator = pendingExplanationBlank ? "\n\n" : "\n";
            currentQuestion.explanation = appendLine(currentQuestion.explanation, addition, separator);
            pendingExplanationBlank = false;
        }

        private void finalizePassageSegments() {
            List<String> segments = new ArrayList<>(passageSegments);
            String last = pendingText.toString().trim();
            if (!last.isEmpty()) {
                segments.add(last);
            }
            collector.setPassageContent(segments.isEmpty() ? "" : segments.get(0));
            if (segments.size() > 1) {
                collector.setPassageExtraContents(new ArrayList<>(segments.subList(1, segments.size())));
            }
            collector.setPassageTranslation(pendingTranslation.toString().trim());
            passageSegments.clear();
        }

        private void handleOptionLine(String rawLabel, ParsedOption parsedOption, boolean isStyled) {
            String label = rawLabel.toUpperCase(Locale.ROOT);

            if (currentQuestion.options.containsKey(label)) {
                boolean nearlyComplete = currentQuestion.options.size() >= ALLOWED_LABELS.size() - 1;
                if (nearlyComplete) {
                    log.warn(
                            "Question no='{}' option '{}' duplicated -> treat as next question (missing number)",
                            currentQuestion.questionNumber,
                            label
                    );
                    String prevNumber = currentQuestion.questionNumber;
                    flushCurrentQuestion();
                    String inferredText = pendingText.toString().trim();
                    pendingText.setLength(0);
                    currentQuestion = new ParsedQuestion("(after_" + prevNumber + ")", inferredText);
                    lastLabel = null;
                } else {
                    String oldValue = currentQuestion.options.get(label);
                    log.warn(
                            "Question no='{}' option '{}' duplicated with only {} options"
                                    + " -> merge old option into question text (likely false positive)",
                            currentQuestion.questionNumber,
                            label,
                            currentQuestion.options.size()
                    );

                    currentQuestion.questionText = appendLine(
                            currentQuestion.questionText,
                            oldValue,
                            " "
                    );
                    currentQuestion.options.remove(label);
                    currentQuestion.correctLabels.remove(label);
                }
            }

            currentQuestion.options.put(label, parsedOption.optionText);
            lastLabel = label;
            if (isStyled || parsedOption.isMarkedCorrect) {
                currentQuestion.correctLabels.add(label);
            }
        }

        private void handleContinuationLine(String text) {
            if (inPassageHeader) {

                StringBuilder target = inPassageTranslation ? pendingTranslation : pendingText;
                if (target.length() > 0) {

                    target.append(pendingPassageBlank ? "\n\n" : "\n");
                }
                pendingPassageBlank = false;
                target.append(text);
                return;
            }
            if (currentQuestion == null) {
                return;
            }
            if (currentQuestion.options.isEmpty()) {

                currentQuestion.questionText = appendLine(currentQuestion.questionText, text, "\n");
            } else if (currentQuestion.options.size() >= ALLOWED_LABELS.size()) {

                if (pendingText.length() > 0) {
                    pendingText.append("\n");
                }
                pendingText.append(text);
            } else if (lastLabel != null) {

                String lastValue = currentQuestion.options.getOrDefault(lastLabel, "");
                currentQuestion.options.put(lastLabel, appendLine(lastValue, text, " "));
            }
        }

        private void flushCurrentQuestion() {
            if (currentQuestion == null) {
                return;
            }
            if (isValidQuestion(currentQuestion)) {
                collector.emitQuestion(currentQuestion);
            } else {
                logInvalidQuestion(currentQuestion);
            }
            currentQuestion = null;
            lastLabel = null;
            inExplanation = false;
        }
    }

    private class FlatQuestionCollector implements QuestionCollector {
        private final List<NormalQuestionRequest> results = new ArrayList<>();

        @Override
        public void emitQuestion(ParsedQuestion q) {
            results.add(buildRequest(q));
        }

        List<NormalQuestionRequest> getResults() {
            return results;
        }
    }

    private class PassageGroupCollector implements QuestionCollector {
        private final List<PassageQuestionGroup> groups = new ArrayList<>();
        private PassageQuestionGroup currentGroup;

        @Override
        public boolean supportsPassage() {
            return true;
        }

        @Override
        public void startPassage() {

            finalizeLastGroup();
            currentGroup = createEmptyGroup();
        }

        @Override
        public void setPassageContent(String content) {
            if (currentGroup == null) {
                currentGroup = createEmptyGroup();
            }
            currentGroup.getPassage().setContent(content);
        }

        @Override
        public void setPassageTranslation(String translation) {
            if (translation == null || translation.isBlank()) {
                return;
            }
            if (currentGroup == null) {
                currentGroup = createEmptyGroup();
            }
            currentGroup.getPassage().setContentTranslation(translation);
        }

        @Override
        public void setPassageExtraContents(List<String> extraContents) {
            if (extraContents == null || extraContents.isEmpty()) {
                return;
            }
            if (currentGroup == null) {
                currentGroup = createEmptyGroup();
            }
            currentGroup.getPassage().setExtraContents(extraContents);
        }

        @Override
        public void emitQuestion(ParsedQuestion q) {

            if (currentGroup == null) {
                currentGroup = createEmptyGroup();
            }
            currentGroup.getQuestions().add(buildRequest(q));
        }

        void finalizeLastGroup() {
            if (currentGroup != null && !currentGroup.getQuestions().isEmpty()) {
                groups.add(currentGroup);
            }
            currentGroup = null;
        }

        List<PassageQuestionGroup> getResults() {
            return groups;
        }

        private PassageQuestionGroup createEmptyGroup() {
            PassageQuestionGroup group = new PassageQuestionGroup();
            PassageRequest pr = new PassageRequest();
            pr.setPassageType(Passage.PassageType.READING);
            pr.setContent("");
            group.setPassage(pr);
            group.setQuestions(new ArrayList<>());
            return group;
        }
    }

    private String extractQuestionText(Matcher qm) {
        if (qm.groupCount() >= 2 && qm.group(2) != null) {
            return qm.group(2).trim();
        }
        if (qm.groupCount() >= 3 && qm.group(3) != null) {
            return qm.group(3).trim();
        }
        return "";
    }

    private String appendLine(String existing, String addition, String separator) {
        if (existing == null || existing.isBlank()) {
            return addition;
        }
        return (existing + separator + addition).trim();
    }

    private boolean isLikelyOptionLine(String rawLine, String optionText) {
        if (rawLine == null) {
            return false;
        }
        String trimmed = cleanWhitespace(rawLine);
        if (trimmed.length() < 2) {
            return false;
        }

        int i = 0;
        while (i < trimmed.length() && Character.isWhitespace(trimmed.charAt(i))) {
            i++;
        }
        if (i >= trimmed.length()) {
            return false;
        }
        if (trimmed.charAt(i) == '(') {
            i++;
        }
        if (i >= trimmed.length()) {
            return false;
        }
        i++;
        while (i < trimmed.length() && Character.isWhitespace(trimmed.charAt(i))) {
            i++;
        }
        if (i < trimmed.length()) {
            char c = trimmed.charAt(i);
            if (c == '.' || c == ')' || c == ':' || c == '-') {
                return true;
            }
        }

        String t = optionText == null ? "" : optionText.trim();
        if (t.isEmpty()) {
            return false;
        }
        int wordCount = t.split("\\s+").length;
        return t.length() <= MAX_INLINE_OPTION_CHARS && wordCount <= MAX_INLINE_OPTION_WORDS;
    }

    private List<String> splitLineByOptionLabels(String line) {
        if (line == null || line.isBlank()) {
            return List.of();
        }
        Matcher m = OPTION_LABEL_START.matcher(line);
        List<Integer> starts = new ArrayList<>();
        while (m.find()) {

            int s = m.group(1) != null ? m.start(1) : m.start(2);

            if (s > 0 && line.charAt(s - 1) == '(') {
                s--;
            }
            starts.add(s);
        }
        if (starts.isEmpty()) {
            return List.of(line);
        }
        List<String> out = new ArrayList<>();

        int firstStart = starts.get(0);
        if (firstStart > 0) {
            String head = line.substring(0, firstStart).trim();
            if (!head.isEmpty()) {
                out.add(head);
            }
        }
        for (int i = 0; i < starts.size(); i++) {
            int from = starts.get(i);
            int to = i + 1 < starts.size() ? starts.get(i + 1) : line.length();
            String seg = line.substring(from, to).trim();
            if (!seg.isEmpty()) {
                out.add(seg);
            }
        }
        return out;
    }

    private boolean isOptionSegmentStyled(XWPFParagraph para, String segmentText) {
        if (segmentText == null || segmentText.isBlank()) {
            return false;
        }
        String trimmedSeg = segmentText.trim();
        if (checkStyledRunsOverlapSegment(para, trimmedSeg)) {
            return true;
        }
        return fallbackStyledRunTouchesSegment(trimmedSeg, para);
    }

    private boolean checkStyledRunsOverlapSegment(XWPFParagraph para, String trimmedSeg) {
        String flat = paragraphTextFromRuns(para);
        if (flat.isEmpty()) {
            return false;
        }
        int idx = flat.indexOf(trimmedSeg);
        if (idx < 0) {
            return false;
        }
        int segStart = idx;
        int segEnd = idx + trimmedSeg.length();

        int pos = 0;
        for (XWPFRun run : para.getRuns()) {
            String rt = run.getText(0);
            if (rt == null) {
                continue;
            }
            int runStart = pos;
            int runEnd = pos + rt.length();
            if (isRunAnswerStyled(run) && runEnd > segStart && runStart < segEnd) {
                return true;
            }
            pos = runEnd;
        }
        return false;
    }

    private boolean fallbackStyledRunTouchesSegment(String trimmedSeg, XWPFParagraph para) {
        String normSeg = normalizeText(trimmedSeg);
        for (XWPFRun run : para.getRuns()) {
            String runText = run.getText(0);
            if (runText == null || !isRunAnswerStyled(run)) {
                continue;
            }
            String t = runText.trim();
            if (t.isEmpty()) {
                continue;
            }
            if (t.length() == 1) {
                if (Character.isDigit(t.charAt(0)) && singleDigitStyledMatchesOptionBody(trimmedSeg, t)) {
                    return true;
                }
                continue;
            }

            String normRun = normalizeText(t);
            if (normRun.length() < MIN_FALLBACK_STYLED_RUN_LENGTH) {

                if (trimmedSeg.contains(t) && t.length() >= 3) {
                    return true;
                }
                continue;
            }
            if (trimmedSeg.contains(t) || normSeg.contains(normRun)) {
                return true;
            }
        }
        return false;
    }

    private boolean singleDigitStyledMatchesOptionBody(String trimmedSeg, String digit) {
        Matcher om = OPTION_PATTERN.matcher(trimmedSeg);
        if (!om.matches()) {
            return false;
        }
        String body = om.group(2) == null ? "" : om.group(2).trim();
        return body.equals(digit);
    }

    private String paragraphTextFromRuns(XWPFParagraph para) {
        StringBuilder sb = new StringBuilder();
        for (XWPFRun run : para.getRuns()) {
            String t = run.getText(0);
            if (t != null) {
                sb.append(t);
            }
        }
        return sb.toString();
    }

    private boolean isRunAnswerStyled(XWPFRun run) {
        return run.isBold()
                || isColoredRun(run)
                || isHighlightedRun(run)
                || run.getUnderline() != UnderlinePatterns.NONE;
    }

    private boolean isColoredRun(XWPFRun run) {
        String color = run.getColor();
        return color != null
                && !color.isBlank()
                && !"auto".equalsIgnoreCase(color)
                && !"000000".equalsIgnoreCase(color);
    }

    private boolean isHighlightedRun(XWPFRun run) {
        return run.getTextHightlightColor() != null
                && !"none".equalsIgnoreCase(String.valueOf(run.getTextHightlightColor()));
    }

    private ParsedOption parseOptionText(String rawOptionText) {
        if (rawOptionText == null) {
            return new ParsedOption("", false);
        }
        String trimmed = rawOptionText.trim();
        for (String marker : CORRECT_ANSWER_MARKERS) {
            if (trimmed.endsWith(marker)) {
                String cleaned = trimmed.substring(0, trimmed.length() - marker.length()).trim();
                return new ParsedOption(cleaned, true);
            }
        }
        return new ParsedOption(trimmed, false);
    }

    private boolean isSectionHeadingOptionLike(String text) {
        return SECTION_HEADING_OPTION_LIKE_PATTERN.matcher(text).matches();
    }

    private boolean isSkippableLine(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.isEmpty()) {
            return true;
        }
        if (PAGE_FOOTER_PATTERN.matcher(trimmed).matches() || EXAM_CODE_PATTERN.matcher(trimmed).matches()) {
            return true;
        }
        String lower = trimmed.toLowerCase(Locale.ROOT);
        for (String prefix : SKIPPABLE_PREFIXES) {
            if (lower.startsWith(prefix)) {
                return true;
            }
        }
        for (String keyword : SKIPPABLE_CONTAINS) {
            if (lower.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String getOptionLabel(String text) {
        Matcher m = OPTION_PATTERN.matcher(text);
        return m.matches() ? m.group(1).toUpperCase(Locale.ROOT) : null;
    }

    private String cleanWhitespace(String s) {
        if (s == null) {
            return "";
        }

        return WEIRD_WHITESPACE_PATTERN.matcher(s).replaceAll(" ").trim();
    }

    private boolean isBulletLine(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        return BULLET_LINE_PATTERN.matcher(text).matches();
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        return text.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private boolean isValidQuestion(ParsedQuestion q) {
        return q.options.size() >= 2;
    }

    private NormalQuestionRequest buildRequest(ParsedQuestion q) {
        Set<String> correctLabels = normalizeCorrectLabels(q);
        List<AnswerRequest> answers = new ArrayList<>();
        for (String label : ALLOWED_LABELS) {
            if (q.options.containsKey(label)) {
                boolean isCorrect = correctLabels.contains(label);
                answers.add(new AnswerRequest(null, q.options.get(label), isCorrect, label));
            }
        }
        String questionText = q.questionText == null ? "" : q.questionText.trim();
        NormalQuestionRequest request = new NormalQuestionRequest();
        request.setQuestionText(questionText);

        request.setQuestionType(correctLabels.size() > 1
                ? Question.QuestionType.MSQ
                : Question.QuestionType.MCQ);
        request.setAnswers(answers);
        request.setNeedsManualCorrect(correctLabels.isEmpty());
        if (q.explanation != null) {
            String trimmed = q.explanation.trim();
            if (!trimmed.isEmpty()) {
                request.setExplanation(trimmed);
            }
        }
        if (!q.tagNames.isEmpty()) {
            request.setTagNames(new ArrayList<>(q.tagNames));
        }
        return request;
    }

    private Set<String> normalizeCorrectLabels(ParsedQuestion q) {

        return q.correctLabels;
    }

    private void logInvalidQuestion(ParsedQuestion q) {
        String preview = q.questionText == null ? "" : q.questionText.trim();
        if (preview.length() > LOG_QUESTION_PREVIEW_LIMIT) {
            preview = preview.substring(0, LOG_QUESTION_PREVIEW_LIMIT) + "...";
        }
        log.warn(
                "Skip invalid question no='{}' options={} labels={} question='{}'",
                q.questionNumber,
                q.options.keySet(),
                q.correctLabels,
                preview
        );
    }

    private static class ParsedLine {
        final String text;
        final boolean isStyled;

        final boolean blank;

        ParsedLine(String text, boolean isStyled) {
            this.text = text;
            this.isStyled = isStyled;
            this.blank = false;
        }

        private ParsedLine() {
            this.text = "";
            this.isStyled = false;
            this.blank = true;
        }

        static ParsedLine blankMarker() {
            return new ParsedLine();
        }
    }

    private static class ParsedQuestion {
        final String questionNumber;
        String questionText;
        String explanation;
        final Map<String, String> options = new LinkedHashMap<>();
        final Set<String> correctLabels = new HashSet<>();
        final List<String> tagNames = new ArrayList<>();

        ParsedQuestion(String number, String text) {
            this.questionNumber = number;
            this.questionText = text;
        }
    }

    private static class ParsedOption {
        final String optionText;
        final boolean isMarkedCorrect;

        ParsedOption(String optionText, boolean isMarkedCorrect) {
            this.optionText = optionText;
            this.isMarkedCorrect = isMarkedCorrect;
        }
    }
}
