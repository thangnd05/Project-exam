package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.NormalQuestionRequest;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuestionDocumentImportService {
    private static final Logger log = LoggerFactory.getLogger(QuestionDocumentImportService.class);

    // Bắt được "21.", "Câu 21.", "Question 21.", "(21)."
    private static final Pattern QUESTION_START_PATTERN = 
            Pattern.compile("^\\s*(?:(?:Câu|Question)\\s*)?\\(?(\\d+)\\)?\\s*[\\.:\\-\\)]\\s*(.*)$", Pattern.CASE_INSENSITIVE);

    // Nhận dạng option dạng A. / A) / A: / A- / A <text>
    private static final Pattern OPTION_PATTERN = 
            Pattern.compile("^\\s*([A-D])(?:\\s*[\\.\\):\\-]|\\s+)\\s*(.*)$", Pattern.CASE_INSENSITIVE);

    // Tách option inline kiểu "A. ... B. ..." hoặc phân cách bởi "|" / tab.
    // Với format TOEIC "A text B text", yêu cầu label tiếp theo phải có nội dung sau nó.
    private static final Pattern OPTION_INLINE_SPLITTER = 
            Pattern.compile("\\s*(?:\\||\\t|\\s{2,}|(?<=\\S)\\s(?=[A-D](?:\\s*[\\.\\):\\-]|\\s+)\\S))\\s*", Pattern.CASE_INSENSITIVE);

    // Tránh parse nhầm heading section thành option ("B. READING & WRITING")
    private static final Pattern SECTION_HEADING_OPTION_LIKE_PATTERN =
            Pattern.compile("^[A-D]\\.\\s*[A-Z0-9\\s&/\\-,:]+$");

    // Nhận nhãn option được style ngay ở label
    private static final Pattern STYLED_OPTION_LABEL_PATTERN =
            Pattern.compile("^\\s*([A-D])(?:\\s*[\\.\\):\\-]|\\s|$)", Pattern.CASE_INSENSITIVE);

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

    private static final Pattern PAGE_FOOTER_PATTERN =
            Pattern.compile("^\\s*trang\\s*\\d+\\s*/\\s*\\d+\\s*$", Pattern.CASE_INSENSITIVE);

    private static final Pattern EXAM_CODE_PATTERN =
            Pattern.compile("^\\s*m[aã]\\s*đ[ềe]\\s*\\d+\\s*$", Pattern.CASE_INSENSITIVE);

    public List<NormalQuestionRequest> parseQuestionsFromDocument(MultipartFile file) throws IOException {
        List<ParsedLine> allLines = extractLinesFromDoc(file);
        List<NormalQuestionRequest> parsedQuestions = processLinesIntoQuestions(allLines);

        log.info(
                "Imported '{}' -> lines={}, questions={}",
                Optional.ofNullable(file.getOriginalFilename()).orElse("(unknown)"),
                allLines.size(),
                parsedQuestions.size()
        );
        return parsedQuestions;
    }

    private List<ParsedLine> extractLinesFromDoc(MultipartFile file) throws IOException {
        List<ParsedLine> lines = new ArrayList<>();
        String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("").toLowerCase(Locale.ROOT);

        try (InputStream is = file.getInputStream()) {
            if (filename.endsWith(".docx")) {
                XWPFDocument docx = new XWPFDocument(is);
                extractLinesFromDocx(docx, lines);
            } else if (filename.endsWith(".doc")) {
                HWPFDocument doc = new HWPFDocument(is);
                WordExtractor extractor = new WordExtractor(doc);
                for (String paraText : extractor.getParagraphText()) {
                    if (paraText == null) {
                        continue;
                    }
                    appendPlainLines(paraText, lines);
                }
            } else {
                throw new IOException("Unsupported file type. Only .doc and .docx are accepted.");
            }
        }
        return lines;
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
        if (text == null || text.trim().isEmpty()) return;

        Set<String> styledLabels = detectStyledOptionLabels(para);
        // Tách theo line break trước, rồi mới tách inline option để hỗ trợ nội dung copy/paste trong cùng paragraph.
        String[] logicalLines = text.split("\\R+");
        for (String logicalLine : logicalLines) {
            String cleanLine = logicalLine == null ? "" : logicalLine.trim();
            if (cleanLine.isEmpty()) continue;

            String[] segments = OPTION_INLINE_SPLITTER.split(cleanLine);
            for (String seg : segments) {
                String cleanSeg = seg.trim();
                if (cleanSeg.isEmpty()) continue;

                String label = getOptionLabel(cleanSeg);
                boolean isStyled = false;
                if (label != null) {
                    isStyled = styledLabels.contains(label);
                }
                lines.add(new ParsedLine(cleanSeg, isStyled));
            }
        }
    }

    private void appendPlainLines(String text, List<ParsedLine> lines) {
        if (text == null) {
            return;
        }
        String[] logicalLines = text.split("\\R+");
        for (String logicalLine : logicalLines) {
            String cleanLine = logicalLine == null ? "" : logicalLine.trim();
            if (cleanLine.isEmpty()) {
                continue;
            }
            String[] segments = OPTION_INLINE_SPLITTER.split(cleanLine);
            for (String seg : segments) {
                String clean = seg.trim();
                if (!clean.isEmpty()) {
                    lines.add(new ParsedLine(clean, false));
                }
            }
        }
    }

    private List<NormalQuestionRequest> processLinesIntoQuestions(List<ParsedLine> lines) {
        List<NormalQuestionRequest> results = new ArrayList<>();
        ParsedQuestion current = null;

        for (ParsedLine pl : lines) {
            String text = pl.text;
            if (isSkippableLine(text)) {
                continue;
            }

            Matcher qm = QUESTION_START_PATTERN.matcher(text);
            if (qm.matches()) {
                if (current != null && isValidQuestion(current)) {
                    results.add(buildRequest(current));
                } else if (current != null) {
                    logInvalidQuestion(current);
                }
                current = new ParsedQuestion(qm.group(1), qm.group(2).trim());
                continue;
            }

            Matcher om = OPTION_PATTERN.matcher(text);
            if (om.matches()) {
                if (current != null) {
                    String label = om.group(1).toUpperCase();
                    ParsedOption parsedOption = parseOptionText(om.group(2));
                    String optionText = parsedOption.optionText;
                    if (isSectionHeadingOptionLike(text)) {
                        continue;
                    }
                    if (current.options.containsKey(label)) {
                        log.warn(
                                "Question no='{}' duplicated option '{}' (old='{}', new='{}') - override by new",
                                current.questionNumber,
                                label,
                                current.options.get(label),
                                optionText
                        );
                    }

                    current.options.put(label, optionText);
                    if (pl.isStyled || parsedOption.isMarkedCorrect) {
                        current.correctLabels.add(label);
                    }
                }
                continue;
            }

            if (current != null && current.options.isEmpty()) {
                if (current.questionText == null || current.questionText.isBlank()) {
                    current.questionText = text;
                } else {
                    current.questionText = current.questionText + "\n" + text;
                }
            } else if (current != null && !current.options.isEmpty()) {
                String lastLabel = getLastOptionLabel(current.options);
                if (lastLabel != null) {
                    String lastValue = current.options.getOrDefault(lastLabel, "");
                    String appended = lastValue.isBlank() ? text : lastValue + " " + text;
                    current.options.put(lastLabel, appended.trim());
                }
            }
        }

        if (current != null && isValidQuestion(current)) {
            results.add(buildRequest(current));
        } else if (current != null) {
            logInvalidQuestion(current);
        }
        return results;
    }

    private Set<String> detectStyledOptionLabels(XWPFParagraph para) {
        Set<String> styled = new HashSet<>();
        String paragraphText = para.getParagraphText();
        if (paragraphText == null || paragraphText.trim().isEmpty()) {
            return styled;
        }

        Matcher paragraphOptionMatcher = OPTION_PATTERN.matcher(paragraphText.trim());
        if (!paragraphOptionMatcher.matches()) {
            // Chỉ xét style label cho paragraph bắt đầu bằng option, tránh dính chữ "A" tô đậm trong stem.
            return styled;
        }

        for (XWPFRun run : para.getRuns()) {
            String text = run.getText(0);
            if (text == null || text.isBlank()) {
                continue;
            }
            if (isRunAnswerStyled(run)) {
                Matcher m = STYLED_OPTION_LABEL_PATTERN.matcher(text);
                if (m.find()) {
                    styled.add(m.group(1).toUpperCase());
                }
            }
            // Chỉ cần kiểm tra run đầu tiên có text thực.
            break;
        }
        return styled;
    }

    private boolean isRunAnswerStyled(XWPFRun run) {
        return run.isBold() 
            || isColoredRun(run) 
            || isHighlightedRun(run) 
            || (run.getUnderline() != UnderlinePatterns.NONE);
    }

    private boolean isColoredRun(XWPFRun run) {
        String color = run.getColor();
        return color != null && !color.isBlank() && !"auto".equalsIgnoreCase(color) && !"000000".equalsIgnoreCase(color);
    }

    private boolean isHighlightedRun(XWPFRun run) {
        return run.getTextHightlightColor() != null && !"none".equalsIgnoreCase(String.valueOf(run.getTextHightlightColor()));
    }

    private ParsedOption parseOptionText(String rawOptionText) {
        if (rawOptionText == null) {
            return new ParsedOption("", false);
        }
        String trimmed = rawOptionText.trim();
        if (trimmed.endsWith("*")) {
            String cleaned = trimmed.substring(0, trimmed.length() - 1).trim();
            return new ParsedOption(cleaned, true);
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
        return m.matches() ? m.group(1).toUpperCase() : null;
    }

    private String getLastOptionLabel(Map<String, String> options) {
        String last = null;
        for (String label : options.keySet()) {
            last = label;
        }
        return last;
    }

    private boolean isValidQuestion(ParsedQuestion q) {
        return q.options.size() >= 2;
    }

    private NormalQuestionRequest buildRequest(ParsedQuestion q) {
        List<AnswerRequest> answers = new ArrayList<>();
        Set<String> correctLabels = normalizeCorrectLabels(q);
        for (String label : new String[]{"A", "B", "C", "D"}) {
            if (q.options.containsKey(label)) {
                boolean isCorrect = correctLabels.contains(label);
                answers.add(new AnswerRequest(null, q.options.get(label), isCorrect, label));
            }
        }
        String questionText = q.questionText == null ? "" : q.questionText.trim();
        NormalQuestionRequest request = new NormalQuestionRequest();
        request.setQuestionText(questionText);
        request.setQuestionType(Question.QuestionType.MCQ);
        request.setAnswers(answers);
        request.setNeedsManualCorrect(correctLabels.isEmpty());
        return request;
    }

    private Set<String> normalizeCorrectLabels(ParsedQuestion q) {
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
        if (preview.length() > 120) {
            preview = preview.substring(0, 120) + "...";
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
        String text;
        boolean isStyled;
        ParsedLine(String t, boolean s) { this.text = t; this.isStyled = s; }
    }

    private static class ParsedQuestion {
        String questionNumber;
        String questionText;
        Map<String, String> options = new LinkedHashMap<>();
        Set<String> correctLabels = new HashSet<>();
        ParsedQuestion(String number, String txt) {
            this.questionNumber = number;
            this.questionText = txt;
        }
    }

    private static class ParsedOption {
        String optionText;
        boolean isMarkedCorrect;

        ParsedOption(String optionText, boolean isMarkedCorrect) {
            this.optionText = optionText;
            this.isMarkedCorrect = isMarkedCorrect;
        }
    }
}