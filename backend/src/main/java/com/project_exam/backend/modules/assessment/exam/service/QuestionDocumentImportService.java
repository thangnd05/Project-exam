package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.NormalQuestionRequest;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuestionDocumentImportService {

    // Regex nhận diện bắt đầu câu hỏi (Câu 1:, Question 1., hoặc kết thúc bằng ?) [cite: 28, 171, 253]
    private static final Pattern QUESTION_START_PATTERN = 
            Pattern.compile("^(?:(?:[Cc][âÂ]u)|(?:[Qq]uestion))?\\s*(\\d+)?\\s*[\\.:\\-\\)]\\s*(.+)$");
    
    // Regex nhận diện nhãn lựa chọn A-D [cite: 2, 22, 23]
    private static final Pattern OPTION_PATTERN = 
            Pattern.compile("^([A-Da-d])\\s*[\\).:\\-]\\s*(.+)$");
    
    // Regex dùng để tách các đáp án nằm cùng một dòng [cite: 4, 12, 15]
    private static final Pattern OPTION_INLINE_SPLITTER = 
            Pattern.compile("\\s+(?=[A-Da-d]\\s*[\\).:\\-])");

    public List<NormalQuestionRequest> parseQuestionsFromDocument(MultipartFile file) throws IOException {
        List<ParsedLine> allLines = extractLinesWithStyle(file);
        return processLinesIntoQuestions(allLines);
    }

    private List<ParsedLine> extractLinesWithStyle(MultipartFile file) throws IOException {
        List<ParsedLine> lines = new ArrayList<>();
        String filename = file.getOriginalFilename().toLowerCase();

        try (InputStream is = file.getInputStream()) {
            if (filename.endsWith(".docx")) {
                XWPFDocument doc = new XWPFDocument(is);
                for (XWPFParagraph para : doc.getParagraphs()) {
                    String text = para.getParagraphText().trim();
                    if (text.isEmpty()) continue;

                    // 1. Phát hiện các nhãn (A, B, C, D) có định dạng đặc biệt trong đoạn này 
                    Set<String> styledLabels = detectStyledOptionLabels(para);
                    
                    // 2. Tách dòng nếu có nhiều đáp án trên cùng 1 hàng 
                    String[] segments = OPTION_INLINE_SPLITTER.split(text);
                    for (String seg : segments) {
                        String cleanSeg = seg.trim();
                        if (cleanSeg.isEmpty()) continue;
                        
                        String label = getOptionLabel(cleanSeg);
                        boolean isStyled = (label != null && styledLabels.contains(label));
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

            // Bước 1: Nhận diện câu hỏi mới [cite: 3, 6, 11, 14, 17]
            // Thay thế đoạn Bước 1 hiện tại bằng đoạn này:
            if (isQuestionStart(text)) {
                if (current != null && isValidQuestion(current)) {
                    results.add(buildRequest(current));
                }
                
                String cleanedText = cleanQuestionText(text);
                
                // SỬA ĐỔI CHÍNH: Dùng Regex tìm nhãn A/B/C/D ngay trong nội dung câu hỏi vừa sạch
                // Regex này tìm vị trí đầu tiên xuất hiện nhãn đáp án (A. hoặc B. ...)
                Matcher inlineMatcher = Pattern.compile("^(.*?)\\s*([A-Da-d]\\s*[\\).:\\-].*)$").matcher(cleanedText);
                
                if (inlineMatcher.matches()) {
                    // Phần 1 là câu hỏi thực sự
                    current = new ParsedQuestion(inlineMatcher.group(1).trim());
                    // Phần 2 là chuỗi chứa đáp án, đưa vào hàm xử lý đáp án
                    processOption(current, inlineMatcher.group(2).trim(), pl.isStyled);
                } else {
                    current = new ParsedQuestion(cleanedText);
                }
                continue;
            }

            // Bước 2: Nhận diện các lựa chọn A-D [cite: 4, 12, 15]
            if (current != null) {
                if (processOption(current, text, pl.isStyled)) {
                    continue;
                }
                // Nếu không phải nhãn A-D, thì đây là văn bản nối tiếp của câu hỏi [cite: 87, 88, 89]
                if (current.options.isEmpty()) {
                    current.questionText += " " + text;
                }
            }
        }

        if (current != null && isValidQuestion(current)) {
            results.add(buildRequest(current));
        }

        return results;
    }

    private boolean processOption(ParsedQuestion q, String text, boolean isStyled) {
        Matcher optMatcher = OPTION_PATTERN.matcher(text);
        if (optMatcher.matches()) {
            String label = optMatcher.group(1).toUpperCase();
            String content = optMatcher.group(2).trim();
            q.options.put(label, content);
            if (isStyled) q.correctLabels.add(label);
            return true;
        }
        return false;
    }

    private boolean isQuestionStart(String text) {
        String lower = text.toLowerCase();
        // Loại bỏ các dòng tiêu đề rác [cite: 20, 119, 135, 171]
        if (lower.startsWith("part") || lower.startsWith("reading") || lower.startsWith("choose") || lower.contains("tips")) {
            return false;
        }
        return text.endsWith("?") || QUESTION_START_PATTERN.matcher(text).matches();
    }

    private String cleanQuestionText(String text) {
        Matcher m = QUESTION_START_PATTERN.matcher(text);
        return m.matches() ? m.group(2).trim() : text;
    }

    private String getOptionLabel(String text) {
        Matcher m = OPTION_PATTERN.matcher(text);
        return m.matches() ? m.group(1).toUpperCase() : null;
    }

    private Set<String> detectStyledOptionLabels(XWPFParagraph para) {
        Set<String> styled = new HashSet<>();
        for (XWPFRun run : para.getRuns()) {
            if (isRunStyled(run)) {
                String text = run.getText(0);
                if (text != null) {
                    Matcher m = Pattern.compile("([A-Da-d])\\s*[\\).:\\-]").matcher(text);
                    while (m.find()) {
                        styled.add(m.group(1).toUpperCase());
                    }
                }
            }
        }
        return styled;
    }

    private boolean isRunStyled(XWPFRun run) {
        // Kiểm tra In đậm [cite: 77]
        if (run.isBold()) return true;
        
        // Kiểm tra Màu chữ (Khác màu đen mặc định) [cite: 219, 220]
        String color = run.getColor();
        if (color != null && !color.equals("000000") && !color.equalsIgnoreCase("auto")) return true;
        
        // Kiểm tra Highlight (Tô màu nền) 
        return run.getTextHightlightColor() != null && 
               !run.getTextHightlightColor().toString().equalsIgnoreCase("none");
    }

    private boolean isValidQuestion(ParsedQuestion q) {
        return q.options.size() >= 2 && !q.questionText.trim().isEmpty();
    }

    private NormalQuestionRequest buildRequest(ParsedQuestion q) {
        List<AnswerRequest> answers = new ArrayList<>();
        // Đảm bảo xuất đúng thứ tự A, B, C, D 
        q.options.forEach((label, text) -> {
            answers.add(new AnswerRequest(null, text, q.correctLabels.contains(label), label));
        });
        return new NormalQuestionRequest(q.questionText.trim(), Question.QuestionType.MCQ, answers);
    }

    // Lớp hỗ trợ lưu trữ tạm thời
    private static class ParsedLine {
        String text;
        boolean isStyled;
        ParsedLine(String t, boolean s) { this.text = t; this.isStyled = s; }
    }

    private static class ParsedQuestion {
        String questionText;
        Map<String, String> options = new LinkedHashMap<>(); // Giữ thứ tự A, B, C, D [cite: 22]
        Set<String> correctLabels = new HashSet<>();
        ParsedQuestion(String txt) { this.questionText = txt; }
    }
}