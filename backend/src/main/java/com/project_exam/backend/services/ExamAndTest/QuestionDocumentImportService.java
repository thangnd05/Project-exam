package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.exception.BadRequestException;

import com.project_exam.backend.dto.request.AnswerRequest;
import com.project_exam.backend.dto.request.NormalQuestionRequest;
import com.project_exam.backend.models.Question;
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
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuestionDocumentImportService {
    private static final Pattern QUESTION_PREFIX_PATTERN =
            Pattern.compile("^(?:(?:[Cc][âÂ]u)|(?:[Qq]uestion))?\\s*(\\d+)?\\s*[\\.:\\-\\)]\\s*(.+)$");
    private static final Pattern OPTION_PATTERN =
            Pattern.compile("^([A-Da-d])\\s*[\\).:\\-]\\s*(.+)$");
    private static final Pattern ANSWER_PATTERN =
            Pattern.compile("^(?:(?:[Đđ]áp\\s*[áÁ]n)|(?:[Aa]nswer))\\s*[:\\-]?\\s*([A-Da-d\\s,;/|&]+)\\s*$");
    private static final Pattern OPTION_TOKEN_PATTERN =
            Pattern.compile("(?:^|\\s{2,}|\\t+)([A-Da-d])\\s*[\\).:\\-]");

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
        if (filename.endsWith(".docx")) {
            return extractFromDocx(file);
        }
        if (filename.endsWith(".doc")) {
            return extractFromDoc(file);
        }
        throw new BadRequestException("Chỉ hỗ trợ file Word (.docx hoặc .doc).");
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
                Set<String> styledLabelsInParagraph = detectStyledOptionLabels(paragraph, text.trim());
                for (String expandedLine : expandPossibleMultiOptionLine(text.trim())) {
                    String label = extractOptionLabel(expandedLine);
                    boolean isStyledLine = label != null && styledLabelsInParagraph.contains(label);
                    lines.add(new ParsedLine(expandedLine, isStyledLine));
                }
            }
            return parseQuestionsFromTextLines(lines);
        }
    }

    private List<ParsedLine> toPlainLines(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            throw new BadRequestException("Không đọc được nội dung từ tài liệu.");
        }

        String normalizedText = rawText.replace("\r\n", "\n").replace('\r', '\n');
        String[] lines = normalizedText.split("\n");
        List<ParsedLine> parsedLines = new ArrayList<>();
        for (String rawLine : lines) {
            if (rawLine == null || rawLine.trim().isEmpty()) {
                continue;
            }
            for (String expandedLine : expandPossibleMultiOptionLine(rawLine.trim())) {
                parsedLines.add(new ParsedLine(expandedLine, false));
            }
        }
        return parsedLines;
    }

    private List<String> expandPossibleMultiOptionLine(String line) {
        List<Integer> tokenStarts = getOptionTokenStarts(line);
        if (tokenStarts.size() < 2) {
            return List.of(line);
        }
        List<String> result = new ArrayList<>();
        for (int i = 0; i < tokenStarts.size(); i++) {
            int start = tokenStarts.get(i);
            int end = (i + 1 < tokenStarts.size()) ? tokenStarts.get(i + 1) : line.length();
            String segment = line.substring(start, end).trim();
            if (!segment.isEmpty()) {
                result.add(segment);
            }
        }
        return result;
    }

    private List<Integer> getOptionTokenStarts(String line) {
        List<Integer> starts = new ArrayList<>();
        Matcher matcher = OPTION_TOKEN_PATTERN.matcher(line);
        while (matcher.find()) {
            int labelIndex = matcher.start(1);
            if (labelIndex >= 0) {
                starts.add(labelIndex);
            }
        }
        return starts;
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
                    currentQuestion.correctLabels.addAll(parseAnswerLabels(answerMatcher.group(1)));
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
                    assignCorrectLabelsFromStyleIfPossible(currentQuestion);
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
            assignCorrectLabelsFromStyleIfPossible(currentQuestion);
            NormalQuestionRequest mappedQuestion = mapParsedQuestion(currentQuestion);
            if (mappedQuestion != null) {
                results.add(mappedQuestion);
            }
        }

        if (results.isEmpty()) {
            throw new BadRequestException("Không parse được câu hỏi hợp lệ. Dùng A-D và chọn đúng bằng 'Đáp án: A,B' hoặc tô đậm/màu đáp án đúng (docx).");
        }

        return results;
    }

    private Set<String> parseAnswerLabels(String rawAnswerText) {
        Set<String> labels = new LinkedHashSet<>();
        if (rawAnswerText == null || rawAnswerText.isBlank()) {
            return labels;
        }
        Matcher matcher = Pattern.compile("[A-Da-d]").matcher(rawAnswerText);
        while (matcher.find()) {
            labels.add(matcher.group().toUpperCase(Locale.ROOT));
        }
        return labels;
    }

    private void assignCorrectLabelsFromStyleIfPossible(ParsedQuestion currentQuestion) {
        if (!currentQuestion.correctLabels.isEmpty()) {
            return;
        }
        currentQuestion.correctLabels.addAll(currentQuestion.styledOptionLabels);
    }

    private Set<String> detectStyledOptionLabels(XWPFParagraph paragraph, String paragraphText) {
        List<OptionSpan> optionSpans = getOptionSpans(paragraphText);
        if (optionSpans.isEmpty()) {
            return Set.of();
        }

        Set<String> styledLabels = new LinkedHashSet<>();
        int cursor = 0;
        for (XWPFRun run : paragraph.getRuns()) {
            if (run == null) {
                continue;
            }
            String runText = run.toString();
            if (runText == null || runText.isBlank()) {
                continue;
            }
            int start = paragraphText.indexOf(runText, cursor);
            if (start < 0) {
                start = paragraphText.indexOf(runText);
            }
            if (start < 0) {
                continue;
            }
            int end = start + runText.length();
            cursor = end;

            if (!isStyledRun(run)) {
                continue;
            }

            for (OptionSpan span : optionSpans) {
                if (start < span.end && end > span.start) {
                    styledLabels.add(span.label);
                }
            }
        }
        return styledLabels;
    }

    private List<OptionSpan> getOptionSpans(String line) {
        List<Integer> starts = getOptionTokenStarts(line);
        List<OptionSpan> spans = new ArrayList<>();
        for (int i = 0; i < starts.size(); i++) {
            int start = starts.get(i);
            int end = (i + 1 < starts.size()) ? starts.get(i + 1) : line.length();
            String label = extractOptionLabel(line.substring(start, end).trim());
            if (label != null) {
                spans.add(new OptionSpan(label, start, end));
            }
        }
        return spans;
    }

    private String extractOptionLabel(String line) {
        Matcher matcher = OPTION_PATTERN.matcher(line);
        if (!matcher.matches()) {
            return null;
        }
        return matcher.group(1).toUpperCase(Locale.ROOT);
    }

    private boolean isStyledRun(XWPFRun run) {
        if (run.isBold()) {
            return true;
        }
        if (run.getColor() != null && !run.getColor().isBlank()) {
            return true;
        }
        Object highlight = run.getTextHightlightColor();
        return highlight != null && !"none".equalsIgnoreCase(highlight.toString());
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
        if (parsedQuestion.options.size() < 2 || parsedQuestion.correctLabels.isEmpty()) {
            return null;
        }
        boolean hasAtLeastOneValidCorrect = parsedQuestion.correctLabels.stream()
                .anyMatch(parsedQuestion.options::containsKey);
        if (!hasAtLeastOneValidCorrect) {
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
                    parsedQuestion.correctLabels.contains(label),
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
        private final Set<String> correctLabels = new LinkedHashSet<>();
        private final Set<String> styledOptionLabels = new LinkedHashSet<>();

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

    private static class OptionSpan {
        private final String label;
        private final int start;
        private final int end;

        private OptionSpan(String label, int start, int end) {
            this.label = label;
            this.start = start;
            this.end = end;
        }
    }
}
