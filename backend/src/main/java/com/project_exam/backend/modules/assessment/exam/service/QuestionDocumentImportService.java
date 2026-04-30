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

    // Regex nhận diện bắt đầu câu hỏi: Câu 101., Question 101., hoặc 101.
    private static final Pattern QUESTION_START_PATTERN = 
            Pattern.compile("^(?:(?:Câu|Question)\\s*)?(\\d+)\\s*[\\.:\\-\\)]\\s*(.*)$", Pattern.CASE_INSENSITIVE);
    
    // Regex nhận diện nhãn lựa chọn A-D
    private static final Pattern OPTION_PATTERN = 
            Pattern.compile("^([A-D])(?:\\s*[\\.\\):\\-]|\\s+)\\s*(.+)$", Pattern.CASE_INSENSITIVE);
    
    // Regex an toàn để tách các đáp án nằm cùng một dòng (ưu tiên kiểu có dấu: A. / A) / A:)
    private static final Pattern OPTION_INLINE_SPLITTER = 
            Pattern.compile("\\s+(?=[A-D]\\s*[\\.\\):\\-]\\s+)", Pattern.CASE_INSENSITIVE);

    // Regex nhận diện nhãn đáp án xuất hiện trong run được bold
    private static final Pattern STYLED_OPTION_LABEL_PATTERN =
            Pattern.compile("(?<!\\S)([A-D])(?:\\s*[\\.\\):\\-]|\\s+)", Pattern.CASE_INSENSITIVE);

    public List<NormalQuestionRequest> parseQuestionsFromDocument(MultipartFile file) throws IOException {
        List<ParsedLine> allLines = extractLinesFromDoc(file);
        List<NormalQuestionRequest> parsedQuestions = processLinesIntoQuestions(allLines);

        String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("(unknown)");
        log.info("Imported question doc '{}' -> lines={}, parsedQuestions={}", filename, allLines.size(), parsedQuestions.size());
        return parsedQuestions;
    }

    private List<ParsedLine> extractLinesFromDoc(MultipartFile file) throws IOException {
        List<ParsedLine> lines = new ArrayList<>();
        String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("").toLowerCase();

        try (InputStream is = file.getInputStream()) {
            if (filename.endsWith(".docx")) {
                XWPFDocument doc = new XWPFDocument(is);
                for (XWPFParagraph para : doc.getParagraphs()) {
                    String text = para.getParagraphText().trim();
                    if (text.isEmpty()) continue;

                    // Lấy các nhãn được tô đậm (đáp án đúng)
                    Set<String> styledLabels = detectStyledOptionLabels(para);
                    Set<String> styledTextTokens = detectStyledTextTokens(para);
                    
                    // Tách các đáp án inline thành các dòng riêng biệt
                    String[] segments = OPTION_INLINE_SPLITTER.split(text);
                    for (String seg : segments) {
                        String cleanSeg = seg.trim();
                        if (cleanSeg.isEmpty()) continue;
                        
                        String label = getOptionLabel(cleanSeg);
                        boolean isStyled = false;
                        if (label != null) {
                            // Trường hợp chuẩn: run chứa chính ký tự A/B/C/D được style
                            if (styledLabels.contains(label)) {
                                isStyled = true;
                            }
                            // Trường hợp copy từ đề: chỉ nội dung đáp án được bold, không bold nhãn
                            else if (styledLabels.isEmpty() && isOptionContentStyled(cleanSeg, styledTextTokens)) {
                                isStyled = true;
                            }
                        }
                        
                        lines.add(new ParsedLine(cleanSeg, isStyled));
                    }
                }
            } else if (filename.endsWith(".doc")) {
                HWPFDocument doc = new HWPFDocument(is);
                WordExtractor extractor = new WordExtractor(doc);
                for (String text : extractor.getParagraphText()) {
                    if (text == null || text.trim().isEmpty()) continue;
                    String[] segments = OPTION_INLINE_SPLITTER.split(text.trim());
                    for (String seg : segments) {
                        lines.add(new ParsedLine(seg.trim(), false));
                    }
                }
            }
        }
        return lines;
    }

    private List<NormalQuestionRequest> processLinesIntoQuestions(List<ParsedLine> lines) {
        List<NormalQuestionRequest> results = new ArrayList<>();
        ParsedQuestion current = null;

        for (ParsedLine pl : lines) {
            String text = pl.text;

            // 1. Kiểm tra nếu dòng bắt đầu bằng số thứ tự (Câu hỏi mới)
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

            // 2. Kiểm tra nếu là một đáp án A, B, C, hoặc D
            Matcher om = OPTION_PATTERN.matcher(text);
            if (om.matches()) {
                if (current != null) {
                    String label = om.group(1).toUpperCase();
                    String content = om.group(2).trim();
                    current.options.put(label, content);
                    if (pl.isStyled) current.correctLabels.add(label);
                }
                continue;
            }

            // 3. Nếu là văn bản bình thường -> Nối vào nội dung câu hỏi hiện tại
            if (current != null && current.options.isEmpty()) {
                current.questionText += " " + text;
            }
        }

        // Đóng câu hỏi cuối cùng
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
            // Chỉ dùng bold để tránh nhiễu do màu mặc định/theme của Word
            if (isRunAnswerStyled(run)) {
                String text = run.getText(0);
                if (text != null) {
                    Matcher m = STYLED_OPTION_LABEL_PATTERN.matcher(text);
                    while (m.find()) {
                        styled.add(m.group(1).toUpperCase());
                    }
                }
            }
        }
        return styled;
    }

    private boolean isRunAnswerStyled(XWPFRun run) {
        return run.isBold();
    }

    private Set<String> detectStyledTextTokens(XWPFParagraph para) {
        Set<String> tokens = new HashSet<>();
        for (XWPFRun run : para.getRuns()) {
            if (isRunAnswerStyled(run)) {
                String runText = run.getText(0);
                if (runText == null || runText.isBlank()) {
                    continue;
                }
                String normalized = normalizeText(runText);
                if (normalized.length() >= 2) {
                    tokens.add(normalized);
                }
            }
        }
        return tokens;
    }

    private boolean isOptionContentStyled(String optionLine, Set<String> styledTextTokens) {
        if (styledTextTokens.isEmpty()) {
            return false;
        }
        Matcher m = OPTION_PATTERN.matcher(optionLine);
        if (!m.matches()) {
            return false;
        }
        String normalizedOptionContent = normalizeText(m.group(2));
        if (normalizedOptionContent.isEmpty()) {
            return false;
        }

        for (String token : styledTextTokens) {
            // Chỉ so với token đủ dài để giảm false-positive
            if (token.length() < 3) {
                continue;
            }
            if (normalizedOptionContent.contains(token) || token.contains(normalizedOptionContent)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeText(String text) {
        return text.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String getOptionLabel(String text) {
        Matcher m = OPTION_PATTERN.matcher(text);
        return m.matches() ? m.group(1).toUpperCase() : null;
    }

    private void logInvalidQuestion(ParsedQuestion q) {
        String preview = q.questionText == null ? "" : q.questionText.trim();
        if (preview.length() > 120) {
            preview = preview.substring(0, 120) + "...";
        }

        log.warn(
                "Skipped invalid question no='{}' optionCount={} labels={} question='{}'",
                q.questionNumber == null ? "unknown" : q.questionNumber,
                q.options.size(),
                q.options.keySet(),
                preview
        );
    }

    private boolean isValidQuestion(ParsedQuestion q) {
        return !q.options.isEmpty() && !q.questionText.trim().isEmpty();
    }

    private NormalQuestionRequest buildRequest(ParsedQuestion q) {
        List<AnswerRequest> answers = new ArrayList<>();
        Set<String> normalizedCorrectLabels = normalizeCorrectLabels(q);
        // Xuất đáp án theo đúng thứ tự A -> D
        for (String label : new String[]{"A", "B", "C", "D"}) {
            if (q.options.containsKey(label)) {
                answers.add(new AnswerRequest(null, q.options.get(label), normalizedCorrectLabels.contains(label), label));
            }
        }
        return new NormalQuestionRequest(q.questionText.trim(), Question.QuestionType.MCQ, answers);
    }

    private Set<String> normalizeCorrectLabels(ParsedQuestion q) {
        if (q.correctLabels.size() <= 1) {
            return q.correctLabels;
        }

        log.warn(
                "Question no='{}' has multiple styled answers {}. Mark none to avoid wrong auto-pick",
                q.questionNumber == null ? "unknown" : q.questionNumber,
                q.correctLabels
        );
        return Collections.emptySet();
    }

    // Helper classes
    private static class ParsedLine {
        String text;
        boolean isStyled;
        ParsedLine(String t, boolean s) { this.text = t; this.isStyled = s; }
    }

    private static class ParsedQuestion {
        String questionNumber;
        String questionText;
        Map<String, String> options = new LinkedHashMap<>(); // Giữ thứ tự nạp
        Set<String> correctLabels = new HashSet<>();
        ParsedQuestion(String number, String txt) {
            this.questionNumber = number;
            this.questionText = txt;
        }
    }
}