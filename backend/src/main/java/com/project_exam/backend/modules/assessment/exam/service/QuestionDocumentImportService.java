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

    // =========================================================================
    // CONFIG — đổi rule ở đây, không động logic bên dưới
    // =========================================================================

    /**
     * Nhãn đáp án hợp lệ. Đổi sang ["A","B","C","D","E"] nếu hỗ trợ 5 lựa chọn,
     * hoặc ["1","2","3","4"] nếu dùng số. Khi đổi PHẢI đồng bộ {@link #ALLOWED_LABEL_CLASS}.
     */
    private static final List<String> ALLOWED_LABELS = List.of("A", "B", "C", "D");

    /** Regex character-class tương ứng với {@link #ALLOWED_LABELS}. */
    private static final String ALLOWED_LABEL_CLASS = "[A-D]";

    /** Từ khoá mở đầu câu hỏi. Thêm "Q", "No" nếu cần. */
    private static final String QUESTION_KEYWORDS = "Câu|Question|Bài";

    /** Marker đặt cuối option để đánh dấu đáp án đúng. Vd: "A. London*". */
    private static final List<String> CORRECT_ANSWER_MARKERS = List.of("*");

    /**
     * Heuristic option dạng "A across" (không có dấu phân cách).
     * Vượt quá 2 ngưỡng này -> coi là stem "A ..." chứ không phải option A,
     * tránh nuốt câu dẫn trong đề TOEIC.
     */
    private static final int MAX_INLINE_OPTION_CHARS = 100;
    private static final int MAX_INLINE_OPTION_WORDS = 15;

    /** Cắt question text khi log để tránh spam. */
    private static final int LOG_QUESTION_PREVIEW_LIMIT = 120;

    /** Giới hạn kích thước file upload (byte). */
    private static final long MAX_FILE_SIZE_BYTES = 20L * 1024 * 1024; // 20MB

    /**
     * Ngưỡng tối thiểu (ký tự) để fallback styled-run match được tin tưởng qua substring.
     * Cũ: 3 -> dễ dính từ phổ biến như "the", "and". Nâng lên 6 để giảm false positive.
     */
    private static final int MIN_FALLBACK_STYLED_RUN_LENGTH = 6;

    /**
     * Dòng nên bỏ qua. Đặc thù môn Tiếng Anh — nếu import môn khác, chỉnh ở đây.
     * Lower-case khi so sánh.
     */
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

    // =========================================================================
    // PATTERNS (build từ config phía trên)
    // =========================================================================

    // "21.", "Câu 21.", "(21).", "21", "21 nội dung"
    private static final Pattern QUESTION_START_PATTERN = Pattern.compile(
            "^\\s*(?:(?:" + QUESTION_KEYWORDS + ")\\s*)?\\(?(\\d+)\\)?"
                    + "\\s*(?:(?:[\\.:\\-\\)]\\s*(.*))|(\\S.*))?\\s*$",
            Pattern.CASE_INSENSITIVE
    );

    // A. / A) / (A) / A: / A- / A <text>
    // Negative lookahead (?![-_]{2,}) — sau separator/space, nếu là chuỗi gạch/gạch dưới
    // (fill-in-blank), KHÔNG coi là option line.
    private static final Pattern OPTION_PATTERN = Pattern.compile(
            "^\\s*\\(?(" + ALLOWED_LABEL_CLASS + ")\\)?(?:\\s*[\\.\\):\\-](?![-_]{2,})|\\s+(?![-_]{2,}))\\s*(.*)$",
            Pattern.CASE_INSENSITIVE
    );

    // Vị trí bắt đầu option trên cùng một dòng (dàn ngang nhiều đáp án).
    // - Có dấu phân cách -> chấp nhận đứng sau bất kỳ whitespace nào.
    // - Không dấu phân cách -> bắt buộc >=2 spaces hoặc Tab để tránh nuốt stem.
    // - Negative lookahead (?![-_]{2,}): nếu phía sau là chuỗi dấu gạch/gạch dưới
    //   (fill-in-blank cloze), KHÔNG coi là option. Tránh "began a ------- agreement"
    //   bị tách thành option A.
    private static final Pattern OPTION_LABEL_START = Pattern.compile(
            "(?:^|\\s)\\s*\\(?(" + ALLOWED_LABEL_CLASS + ")\\)?\\s*[\\.\\):\\-](?![-_]{2,})"
                    + "|(?:^|\\s{2,}|\\t)\\s*\\(?(" + ALLOWED_LABEL_CLASS + ")\\)?\\s+(?![-_]{2,})",
            Pattern.CASE_INSENSITIVE
    );

    // "B. READING & WRITING" — heading section, KHÔNG phải option
    // Yêu cầu body bắt đầu bằng CHỮ CÁI VIẾT HOA (không phải digit) để tránh
    // false positive với option dạng "A. 10", "B. 9", v.v.
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

    // Whitespace chars "lạ" gặp trong Word: NBSP, ZWSP, ideographic space, NNBSP
    private static final Pattern WEIRD_WHITESPACE_PATTERN =
            Pattern.compile("[\\u00A0\\u200B\\u3000\\u202F]");

    // =========================================================================
    // ENTRY POINT
    // =========================================================================

    public List<NormalQuestionRequest> parseQuestionsFromDocument(MultipartFile file) throws IOException {
        validateFile(file);
        List<ParsedLine> allLines = extractLinesFromDoc(file);

        // Collector cho flat questions (không có passage).
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

        // Collector cho passage groups.
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

    // =========================================================================
    // EXTRACT LINES — .doc / .docx
    // =========================================================================

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
        // Đây là validation error, không phải I/O.
        throw new IllegalArgumentException("Unsupported file type. Only .doc and .docx are accepted.");
    }

    private List<ParsedLine> extractFromDocx(byte[] bytes) throws IOException {
        // Ưu tiên Mammoth (giữ được style qua HTML để detect đáp án đúng).
        // Fallback POI khi Mammoth không trả về gì.
        List<ParsedLine> mammothLines = extractLinesFromDocxWithMammoth(new ByteArrayInputStream(bytes));
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

    private List<ParsedLine> extractFromLegacyDoc(byte[] bytes) throws IOException {
        // Lưu ý: nhánh .doc KHÔNG detect được style (HWPF API hạn chế).
        // Đáp án bôi đậm trong .doc sẽ rơi vào needsManualCorrect.
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

    private List<ParsedLine> extractLinesFromDocxWithMammoth(InputStream is) {
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
            for (Element block : blocks) {
                String blockText = block.text();
                if (blockText == null || blockText.trim().isEmpty()) {
                    continue;
                }
                // Chỉ lấy style liên quan đến đánh dấu đáp án đúng (bold/underline/highlight/màu).
                // KHÔNG lấy span[style] chung chung vì sẽ dính cả style font/align/line-height.
                Elements styledElements = block.select(
                        "strong, b, u, em, mark,"
                                + " span[style*=color],"
                                + " span[style*=background],"
                                + " span[style*=bold],"
                                + " span[style*=underline]"
                );
                String styledRawText = styledElements.text();
                String normalizedStyled = normalizeText(styledRawText);

                for (String logicalLine : blockText.split("\\R+")) {
                    String cleanLine = cleanWhitespace(logicalLine);
                    if (cleanLine.isEmpty()) {
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
            }
            return lines;
        } catch (Exception e) {
            // Mammoth có thể throw nhiều loại exception (parser, IO).
            // Bắt rộng để fallback POI thay vì fail toàn bộ import.
            log.warn("Mammoth docx->html failed, fallback to POI parser: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Detect option có được style (bold/underline/highlight/màu) hay không, dựa trên
     * text đã trích từ các tag style của block HTML.
     *
     * <p>Yêu cầu match phần BODY của option (nội dung sau dấu chấm) — KHÔNG match nhãn,
     * vì nhãn chỉ là 1 ký tự A/B/C/D rất dễ trùng với chữ cái khác trong text bold.
     * Nếu cần check nhãn được bold riêng, dùng dạng "A." (kèm dấu phân cách) để tránh
     * trùng với chữ A đơn lẻ trong câu.
     */
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

        // (1) Nhãn được style theo dạng "A." — match raw text để tránh normalize làm
        //     mất dấu chấm và dính ký tự khác.
        // (Không check label đơn lẻ vì 1 ký tự quá dễ false-positive.)
        if (styledRawText.contains(label + ".")
                || styledRawText.contains(label + ")")
                || styledRawText.contains("(" + label + ")")
                || styledRawText.contains(label + ":")) {
            return true;
        }

        // (2) Nội dung được style/highlight: A. <strong>London</strong>
        //     Yêu cầu body phải đủ "đặc trưng" — không phải 1 ký tự lẻ.
        if (body.length() < 2) {
            return false;
        }
        String normalizedBody = normalizeText(body);
        if (normalizedBody.isEmpty()) {
            return false;
        }
        return normalizedStyledText.contains(normalizedBody);
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
            return;
        }
        for (String logicalLine : text.split("\\R+")) {
            String cleanLine = cleanWhitespace(logicalLine);
            if (cleanLine.isEmpty()) {
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
        for (String logicalLine : text.split("\\R+")) {
            String cleanLine = cleanWhitespace(logicalLine);
            if (cleanLine.isEmpty()) {
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

    // =========================================================================
    // LINE PROCESSOR — state machine dùng chung cho flat & passage
    // =========================================================================

    /**
     * Callback interface để LineProcessor giao tiếp với "consumer" (flat list hoặc
     * passage groups). Refactor này tránh duplicate logic giữa
     * processLinesIntoQuestions và processLinesIntoPassageGroups.
     */
    private interface QuestionCollector {
        /** Đẩy 1 câu hỏi đã parse hoàn chỉnh vào collector. */
        void emitQuestion(ParsedQuestion q);

        /** Bắt đầu một passage mới (chỉ PassageGroupCollector quan tâm). */
        default void startPassage() {
        }

        /** Set content cho passage hiện tại (chỉ PassageGroupCollector quan tâm). */
        default void setPassageContent(String content) {
        }

        /** True nếu collector hỗ trợ passage (để LineProcessor biết có nên match PASSAGE_START_PATTERN không). */
        default boolean supportsPassage() {
            return false;
        }
    }

    private class LineProcessor {
        private final QuestionCollector collector;

        // State
        private ParsedQuestion currentQuestion;
        private String lastLabel;
        // Buffer các dòng "tail" sau khi câu hiện tại đã đủ options.
        // Dùng làm question text cho câu kế tiếp nếu câu đó thiếu số ở đầu,
        // hoặc làm passage content nếu đang trong passage header.
        private final StringBuilder pendingText = new StringBuilder();
        private boolean inPassageHeader = false;

        LineProcessor(QuestionCollector collector) {
            this.collector = collector;
        }

        void process(List<ParsedLine> lines) {
            for (ParsedLine pl : lines) {
                handleLine(pl);
            }
            flushCurrentQuestion();
            // PassageGroupCollector cần finalize group cuối cùng.
            if (collector instanceof PassageGroupCollector) {
                ((PassageGroupCollector) collector).finalizeLastGroup();
            }
        }

        private void handleLine(ParsedLine pl) {
            String text = pl.text;
            if (isSkippableLine(text)) {
                return;
            }

            // (0) Passage start — chỉ check khi collector hỗ trợ passage.
            if (collector.supportsPassage()) {
                Matcher pm = PASSAGE_START_PATTERN.matcher(text);
                if (pm.matches()) {
                    flushCurrentQuestion();
                    collector.startPassage();
                    pendingText.setLength(0);
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

            // (1) Câu hỏi mới explicit (có số ở đầu)
            Matcher qm = QUESTION_START_PATTERN.matcher(text);
            if (qm.matches()) {
                if (inPassageHeader) {
                    // Đóng phần passage header — pendingText là content của passage.
                    collector.setPassageContent(pendingText.toString().trim());
                    inPassageHeader = false;
                } else {
                    flushCurrentQuestion();
                }
                pendingText.setLength(0);
                currentQuestion = new ParsedQuestion(qm.group(1), extractQuestionText(qm));
                lastLabel = null;
                return;
            }

            // (2) Dòng option A/B/C/D
            Matcher om = OPTION_PATTERN.matcher(text);
            if (om.matches() && currentQuestion != null && !inPassageHeader && !isSectionHeadingOptionLike(text)) {
                ParsedOption parsedOption = parseOptionText(om.group(2));
                if (isLikelyOptionLine(text, parsedOption.optionText)) {
                    handleOptionLine(om.group(1), parsedOption, pl.isStyled);
                    return;
                }
            }

            // (3) Dòng tiếp nối
            handleContinuationLine(text);
        }

        private void handleOptionLine(String rawLabel, ParsedOption parsedOption, boolean isStyled) {
            String label = rawLabel.toUpperCase(Locale.ROOT);

            // Label trùng -> 2 trường hợp:
            //
            // (a) Câu hiện tại đã (gần) đủ options -> đây là câu mới bị thiếu số.
            //     Flush câu cũ, tạo câu mới với question text từ pendingText.
            //
            // (b) Câu hiện tại mới chỉ có 1-2 options -> option đầu nhiều khả năng
            //     là FALSE POSITIVE (vd: dòng "A as a small family..." không có
            //     dấu phân cách bị match nhãn A). Đẩy option cũ về question text
            //     và cho option mới làm option thật, KHÔNG flush câu cũ.
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
                    // Chỉ append body, KHÔNG thêm label.
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
                if (pendingText.length() > 0) {
                    pendingText.append("\n");
                }
                pendingText.append(text);
                return;
            }
            if (currentQuestion == null) {
                return;
            }
            if (currentQuestion.options.isEmpty()) {
                // Chưa có option -> nối vào question text
                currentQuestion.questionText = appendLine(currentQuestion.questionText, text, "\n");
            } else if (currentQuestion.options.size() >= ALLOWED_LABELS.size()) {
                // Đã đủ options -> KHÔNG nối vào option D nữa.
                // Lưu vào buffer; dùng làm question text cho câu mới ngầm (nếu có).
                if (pendingText.length() > 0) {
                    pendingText.append("\n");
                }
                pendingText.append(text);
            } else if (lastLabel != null) {
                // Chưa đủ options -> option có thể tràn dòng, nối vào option cuối
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
        }
    }

    /** Collector cho flat questions (không có passage). */
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

    /** Collector cho passage-based questions. */
    private class PassageGroupCollector implements QuestionCollector {
        private final List<PassageQuestionGroup> groups = new ArrayList<>();
        private PassageQuestionGroup currentGroup;

        @Override
        public boolean supportsPassage() {
            return true;
        }

        @Override
        public void startPassage() {
            // Đóng group cũ nếu có question đã collect
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
        public void emitQuestion(ParsedQuestion q) {
            // Trường hợp file có question trước khi gặp Passage marker -> tạo group rỗng
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

    // =========================================================================
    // PARSING HELPERS
    // =========================================================================

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
        // Có dấu phân cách (A. / A) / A: / A-) -> luôn là option.
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
        i++; // skip label char
        while (i < trimmed.length() && Character.isWhitespace(trimmed.charAt(i))) {
            i++;
        }
        if (i < trimmed.length()) {
            char c = trimmed.charAt(i);
            if (c == '.' || c == ')' || c == ':' || c == '-') {
                return true;
            }
        }
        // Không có dấu phân cách -> dạng "A across".
        // Heuristic: option dạng này thường ngắn; loại "A <sentence...>".
        String t = optionText == null ? "" : optionText.trim();
        if (t.isEmpty()) {
            return false;
        }
        int wordCount = t.split("\\s+").length;
        return t.length() <= MAX_INLINE_OPTION_CHARS && wordCount <= MAX_INLINE_OPTION_WORDS;
    }

    /** Tách một dòng thành các đoạn bắt đầu bằng nhãn option (hỗ trợ dàn ngang nhiều đáp án). */
    private List<String> splitLineByOptionLabels(String line) {
        if (line == null || line.isBlank()) {
            return List.of();
        }
        Matcher m = OPTION_LABEL_START.matcher(line);
        List<Integer> starts = new ArrayList<>();
        while (m.find()) {
            // group 1: nhãn có dấu phân cách; group 2: nhãn không dấu phân cách
            int s = m.group(1) != null ? m.start(1) : m.start(2);
            starts.add(s);
        }
        if (starts.isEmpty()) {
            return List.of(line);
        }
        List<String> out = new ArrayList<>();
        // Giữ phần đầu (trước option đầu tiên) — thường là question text khi
        // câu hỏi và options nằm chung một dòng.
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

    // =========================================================================
    // STYLE DETECTION (POI path — để tìm đáp án đúng qua bold/highlight/underline/màu)
    // =========================================================================

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

    /**
     * Khi text từ runs và getParagraphText() lệch nhau (do field code, bookmark, ...):
     * gần đúng theo từng run trong segment.
     *
     * <p>Run 1 ký tự được xử lý riêng — chỉ chấp nhận khi body của option chính xác là
     * chữ số đó (không dùng endsWith để tránh "5" match "15").
     */
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
            // Yêu cầu run đủ "đặc trưng" (>= MIN_FALLBACK_STYLED_RUN_LENGTH ký tự sau normalize)
            // để tránh các từ phổ biến như "the", "and" gây false positive.
            String normRun = normalizeText(t);
            if (normRun.length() < MIN_FALLBACK_STYLED_RUN_LENGTH) {
                // Vẫn cho phép nếu nguyên đoạn run xuất hiện trong segment ở dạng raw —
                // case này mạnh hơn substring trên text đã normalize.
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

    /**
     * Tránh contains("5") khớp nhầm với "15": chỉ chấp nhận khi body của option
     * chính xác là chữ số đó. Bỏ nhánh endsWith để loại trừ trường hợp "15" bị
     * đánh dấu correct chỉ vì 1 run styled chứa "5".
     */
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

    // =========================================================================
    // GENERIC HELPERS
    // =========================================================================

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
        // Gom các whitespace "lạ" (NBSP, ZWSP, ideographic space, NNBSP) về space thường.
        return WEIRD_WHITESPACE_PATTERN.matcher(s).replaceAll(" ").trim();
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
        // NOTE: hiện tại import chỉ hỗ trợ MCQ. Nếu mở rộng (T/F, multi-select)
        // cần đổi cả ở đây và ở normalizeCorrectLabels.
        request.setQuestionType(Question.QuestionType.MCQ);
        request.setAnswers(answers);
        request.setNeedsManualCorrect(correctLabels.isEmpty());
        return request;
    }

    private Set<String> normalizeCorrectLabels(ParsedQuestion q) {
        // MCQ single-correct: nếu có >1 đáp án bị bôi đậm thì bảo thủ -> clear hết,
        // để người duyệt chọn tay, tránh import sai.
        if (q.correctLabels.size() <= 1) {
            return q.correctLabels;
        }
        log.warn(
                "Question no='{}' has multiple styled correct answers {} -> clear to avoid wrong import",
                q.questionNumber,
                q.correctLabels
        );
        return Collections.emptySet();
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

    // =========================================================================
    // VALUE OBJECTS
    // =========================================================================

    private static class ParsedLine {
        final String text;
        final boolean isStyled;

        ParsedLine(String text, boolean isStyled) {
            this.text = text;
            this.isStyled = isStyled;
        }
    }

    private static class ParsedQuestion {
        final String questionNumber;
        String questionText;
        final Map<String, String> options = new LinkedHashMap<>();
        final Set<String> correctLabels = new HashSet<>();

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