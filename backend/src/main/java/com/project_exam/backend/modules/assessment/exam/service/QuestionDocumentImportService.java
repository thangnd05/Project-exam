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
            Pattern.compile("^([A-D])(?:\\s*[\\.\\):\\-]|\\s+)\\s*(.+)$", Pattern.CASE_INSENSITIVE);

    // Tách option inline kiểu "A. ... B. ..." hoặc phân cách bởi "|" / tab
    private static final Pattern OPTION_INLINE_SPLITTER = 
            Pattern.compile("\\s*(?:\\||\\t|\\s{2,})\\s*(?=[A-D](?:\\s*[\\.\\):\\-]|\\s+)\\S)", Pattern.CASE_INSENSITIVE);

    // Tránh parse nhầm heading section thành option ("B. READING & WRITING")
    private static final Pattern SECTION_HEADING_OPTION_LIKE_PATTERN =
            Pattern.compile("^[A-D]\\.\\s*[A-Z0-9\\s&/\\-,:]+$");

    // Nhận nhãn option được style ngay ở label
    private static final Pattern STYLED_OPTION_LABEL_PATTERN =
            Pattern.compile("(?<!\\S)([A-D])(?:\\s*[\\.\\):\\-]|\\s+)", Pattern.CASE_INSENSITIVE);

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

    private void processParagraph(XWPFParagraph para, List<ParsedLine> lines) {
        String text = para.getParagraphText();
        if (text == null || text.trim().isEmpty()) return;

        Set<String> styledLabels = detectStyledOptionLabels(para);
        Set<String> styledTextTokens = detectStyledTextTokens(para);

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
                    if (styledLabels.contains(label)) {
                        isStyled = true;
                    } else if (styledLabels.isEmpty() && isOptionContentStyled(cleanSeg, styledTextTokens)) {
                        isStyled = true;
                    }
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
                    String optionText = om.group(2).trim();
                    if (isSectionHeadingOptionLike(text)) {
                        continue;
                    }
                    if (current.options.containsKey(label)) {
                        log.warn(
                                "Question no='{}' duplicated option '{}' (old='{}', new='{}') - keep old",
                                current.questionNumber,
                                label,
                                current.options.get(label),
                                optionText
                        );
                        continue;
                    }

                    current.options.put(label, optionText);
                    if (pl.isStyled) {
                        current.correctLabels.add(label);
                    }
                }
                continue;
            }

            if (current != null && current.options.isEmpty()) {
                current.questionText += " " + text;
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
        for (XWPFRun run : para.getRuns()) {
            if (isRunAnswerStyled(run)) {
                String text = run.getText(0);
                if (text != null) {
                    Matcher m = STYLED_OPTION_LABEL_PATTERN.matcher(text);
                    while (m.find()) styled.add(m.group(1).toUpperCase());
                }
            }
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

    private Set<String> detectStyledTextTokens(XWPFParagraph para) {
        Set<String> tokens = new HashSet<>();
        for (XWPFRun run : para.getRuns()) {
            if (isRunAnswerStyled(run)) {
                String runText = run.getText(0);
                if (runText != null && runText.length() >= 2) {
                    String normalized = normalizeText(runText);
                    if (normalized.length() >= 2) {
                        tokens.add(normalized);
                    }
                }
            }
        }
        return tokens;
    }

    private boolean isOptionContentStyled(String optionLine, Set<String> styledTextTokens) {
        Matcher m = OPTION_PATTERN.matcher(optionLine);
        if (!m.matches()) return false;
        String content = normalizeText(m.group(2));
        for (String token : styledTextTokens) {
            if (token.length() >= 3 && (content.contains(token) || token.contains(content))) return true;
        }
        return false;
    }

    private String normalizeText(String text) {
        return text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim().replaceAll("\\s+", " ");
    }

    private boolean isSectionHeadingOptionLike(String text) {
        return SECTION_HEADING_OPTION_LIKE_PATTERN.matcher(text).matches();
    }

    private boolean isSkippableLine(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.isEmpty()) {
            return true;
        }
        String lower = trimmed.toLowerCase(Locale.ROOT);
        return lower.startsWith("part ")
                || lower.startsWith("choose the correct answer")
                || lower.startsWith("choose a, b, c, or d")
                || lower.startsWith("i.")
                || lower.contains("reading & writing")
                || lower.contains("pronunciation in the following questions");
    }

    private String getOptionLabel(String text) {
        Matcher m = OPTION_PATTERN.matcher(text);
        return m.matches() ? m.group(1).toUpperCase() : null;
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
        return new NormalQuestionRequest(questionText, Question.QuestionType.MCQ, answers);
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
}