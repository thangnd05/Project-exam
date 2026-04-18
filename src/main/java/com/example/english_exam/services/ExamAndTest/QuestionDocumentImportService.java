package com.example.english_exam.services.ExamAndTest;

import com.example.english_exam.dto.request.AnswerRequest;
import com.example.english_exam.dto.request.NormalQuestionRequest;
import com.example.english_exam.models.Question;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuestionDocumentImportService {
    private static final Pattern QUESTION_PREFIX_PATTERN =
            Pattern.compile("^(?:(?:[Cc][âÂ]u)|(?:[Qq]uestion))?\\s*(\\d+)?\\s*[\\.:\\-\\)]\\s*(.+)$");
    private static final Pattern OPTION_PATTERN =
            Pattern.compile("^([A-Da-d])\\s*[\\).:\\-]\\s*(.+)$");
    private static final Pattern ANSWER_PATTERN =
            Pattern.compile("^(?:(?:[Đđ]áp\\s*[áÁ]n)|(?:[Aa]nswer))\\s*[:\\-]?\\s*([A-Da-d])\\s*$");

    public List<NormalQuestionRequest> parseQuestionsFromDocument(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (filename.endsWith(".docx")) {
            return parseQuestionsFromDocx(file);
        }
        String textContent = extractText(file);
        return parseQuestionsFromTextLines(toPlainLines(textContent));
    }

    private String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (filename.endsWith(".pdf")) {
            return extractFromPdf(file);
        }
        if (filename.endsWith(".docx")) {
            return extractFromDocx(file);
        }
        if (filename.endsWith(".doc")) {
            return extractFromDoc(file);
        }
        throw new RuntimeException("Chỉ hỗ trợ file PDF, DOCX hoặc DOC.");
    }

    private String extractFromPdf(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String extractFromDocx(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder result = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                String text = paragraph.getText();
                if (text != null) {
                    result.append(text).append('\n');
                }
            }
            return result.toString();
        }
    }

    private String extractFromDoc(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             HWPFDocument document = new HWPFDocument(inputStream);
             WordExtractor extractor = new WordExtractor(document)) {
            return extractor.getText();
        }
    }

    private List<NormalQuestionRequest> parseQuestionsFromDocx(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             XWPFDocument document = new XWPFDocument(inputStream)) {
            List<ParsedLine> lines = new ArrayList<>();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                String text = paragraph.getText();
                if (text == null || text.trim().isEmpty()) {
                    continue;
                }
                lines.add(new ParsedLine(text.trim(), hasStyledRun(paragraph)));
            }
            return parseQuestionsFromTextLines(lines);
        }
    }

    private List<ParsedLine> toPlainLines(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            throw new RuntimeException("Không đọc được nội dung từ tài liệu.");
        }

        String normalizedText = rawText.replace("\r\n", "\n").replace('\r', '\n');
        String[] lines = normalizedText.split("\n");
        List<ParsedLine> parsedLines = new ArrayList<>();
        for (String rawLine : lines) {
            if (rawLine == null || rawLine.trim().isEmpty()) {
                continue;
            }
            parsedLines.add(new ParsedLine(rawLine.trim(), false));
        }
        return parsedLines;
    }

    private List<NormalQuestionRequest> parseQuestionsFromTextLines(List<ParsedLine> lines) {
        List<NormalQuestionRequest> results = new ArrayList<>();
        ParsedQuestion currentQuestion = null;
        String currentOptionLabel = null;

        for (ParsedLine parsedLine : lines) {
            String line = parsedLine.text;

            Matcher answerMatcher = ANSWER_PATTERN.matcher(line);
            if (answerMatcher.matches()) {
                if (currentQuestion != null) {
                    currentQuestion.correctLabel = answerMatcher.group(1).toUpperCase(Locale.ROOT);
                }
                continue;
            }

            Matcher optionMatcher = OPTION_PATTERN.matcher(line);
            if (optionMatcher.matches()) {
                if (currentQuestion == null) {
                    continue;
                }
                currentOptionLabel = optionMatcher.group(1).toUpperCase(Locale.ROOT);
                currentQuestion.options.put(currentOptionLabel, optionMatcher.group(2).trim());
                if (parsedLine.isStyled) {
                    currentQuestion.styledOptionLabels.add(currentOptionLabel);
                }
                continue;
            }

            if (looksLikeQuestionStart(line)) {
                if (currentQuestion != null) {
                    assignCorrectLabelFromStyleIfPossible(currentQuestion);
                    NormalQuestionRequest mappedQuestion = mapParsedQuestion(currentQuestion);
                    if (mappedQuestion != null) {
                        results.add(mappedQuestion);
                    }
                }
                currentQuestion = new ParsedQuestion(cleanQuestionPrefix(line));
                currentOptionLabel = null;
                continue;
            }

            if (currentQuestion == null) {
                continue;
            }

            if (currentOptionLabel != null && currentQuestion.options.containsKey(currentOptionLabel)) {
                String existing = currentQuestion.options.get(currentOptionLabel);
                currentQuestion.options.put(currentOptionLabel, existing + " " + line);
            } else {
                currentQuestion.questionText = currentQuestion.questionText + " " + line;
            }
        }

        if (currentQuestion != null) {
            assignCorrectLabelFromStyleIfPossible(currentQuestion);
            NormalQuestionRequest mappedQuestion = mapParsedQuestion(currentQuestion);
            if (mappedQuestion != null) {
                results.add(mappedQuestion);
            }
        }

        if (results.isEmpty()) {
            throw new RuntimeException("Không parse được câu hỏi hợp lệ. Dùng A-D và chọn đúng bằng 'Đáp án: X' hoặc tô đậm/màu cho 1 đáp án (docx).");
        }

        return results;
    }

    private void assignCorrectLabelFromStyleIfPossible(ParsedQuestion currentQuestion) {
        if (currentQuestion.correctLabel != null) {
            return;
        }
        if (currentQuestion.styledOptionLabels.size() == 1) {
            currentQuestion.correctLabel = currentQuestion.styledOptionLabels.get(0);
            return;
        }
        if (currentQuestion.styledOptionLabels.size() > 1) {
            throw new RuntimeException("Phát hiện nhiều đáp án được tô định dạng trong cùng 1 câu. Vui lòng chỉ tô 1 đáp án hoặc dùng dòng 'Đáp án: X'.");
        }
    }

    private boolean hasStyledRun(XWPFParagraph paragraph) {
        for (XWPFRun run : paragraph.getRuns()) {
            if (run == null) {
                continue;
            }
            if (run.isBold()) {
                return true;
            }
            if (run.getColor() != null && !run.getColor().isBlank()) {
                return true;
            }
            Object highlight = run.getTextHightlightColor();
            if (highlight != null && !"none".equalsIgnoreCase(highlight.toString())) {
                return true;
            }
        }
        return false;
    }

    private boolean looksLikeQuestionStart(String line) {
        if (line.endsWith("?")) {
            return true;
        }
        return QUESTION_PREFIX_PATTERN.matcher(line).matches();
    }

    private String cleanQuestionPrefix(String line) {
        Matcher matcher = QUESTION_PREFIX_PATTERN.matcher(line);
        if (matcher.matches()) {
            String content = matcher.group(2);
            if (content != null && !content.trim().isEmpty()) {
                return content.trim();
            }
        }
        return line;
    }

    private NormalQuestionRequest mapParsedQuestion(ParsedQuestion parsedQuestion) {
        if (parsedQuestion.questionText == null || parsedQuestion.questionText.trim().isEmpty()) {
            return null;
        }
        if (parsedQuestion.options.size() < 2 || parsedQuestion.correctLabel == null) {
            return null;
        }
        if (!parsedQuestion.options.containsKey(parsedQuestion.correctLabel)) {
            return null;
        }

        List<AnswerRequest> answers = new ArrayList<>();
        for (String label : List.of("A", "B", "C", "D")) {
            String optionText = parsedQuestion.options.get(label);
            if (optionText == null) {
                continue;
            }
            answers.add(new AnswerRequest(
                    null,
                    optionText.trim(),
                    label.equals(parsedQuestion.correctLabel),
                    label
            ));
        }

        return new NormalQuestionRequest(
                parsedQuestion.questionText.trim(),
                Question.QuestionType.MCQ,
                answers
        );
    }

    private static class ParsedQuestion {
        private String questionText;
        private final Map<String, String> options = new LinkedHashMap<>();
        private String correctLabel;
        private final List<String> styledOptionLabels = new ArrayList<>();

        private ParsedQuestion(String questionText) {
            this.questionText = questionText;
        }
    }

    private static class ParsedLine {
        private final String text;
        private final boolean isStyled;

        private ParsedLine(String text, boolean isStyled) {
            this.text = text;
            this.isStyled = isStyled;
        }
    }
}
