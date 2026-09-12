package com.project_exam.backend.modules.assessment.exam.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.NormalQuestionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageQuestionGroupRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionJsonImportRequest;
import com.project_exam.backend.shared.exception.BadRequestException;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 * Import cau hoi tu file/payload JSON.
 *
 * <p>Khac voi {@link QuestionDocumentImportService} (doan cau truc file Word bang regex), service
 * nay khong suy dien noi dung: chi doc dung nhung gi file khai bao, chuan hoa vai cho may moc
 * (nhan dap an, loai cau hoi) roi bao ve toan bo loi thay vi dung o loi dau tien.
 */
@Service
public class QuestionJsonImportService {

    private static final Logger log = LoggerFactory.getLogger(QuestionJsonImportService.class);

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    private static final int MAX_TOTAL_QUESTIONS = 1000;

    private static final List<String> DEFAULT_LABELS =
            List.of("A", "B", "C", "D", "E", "F", "G", "H", "I", "J");

    private static final int MAX_ANSWERS_PER_QUESTION = DEFAULT_LABELS.size();

    private static final int MAX_REPORTED_ERRORS = 100;

    private final ObjectReader strictReader;

    public QuestionJsonImportService(ObjectMapper objectMapper) {
        this.strictReader = objectMapper.copy()
                .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .readerFor(QuestionJsonImportRequest.class);
    }

    public QuestionJsonImportRequest parse(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn file JSON.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException(
                    "File quá lớn. Tối đa " + (MAX_FILE_SIZE_BYTES / (1024 * 1024)) + "MB.");
        }
        String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("");
        if (!filename.isBlank() && !filename.toLowerCase(Locale.ROOT).endsWith(".json")) {
            throw new BadRequestException("Chỉ nhận file .json.");
        }

        QuestionJsonImportRequest payload = parse(new String(file.getBytes(), StandardCharsets.UTF_8));
        log.info("Parsed JSON import file '{}' ({} bytes)", filename, file.getSize());
        return payload;
    }

    public QuestionJsonImportRequest parse(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            throw new BadRequestException("Nội dung JSON trống.");
        }
        try {
            QuestionJsonImportRequest payload = strictReader.readValue(rawJson);
            if (payload == null) {
                throw new BadRequestException("Nội dung JSON trống.");
            }
            return payload;
        } catch (UnrecognizedPropertyException ex) {
            throw new BadRequestException(
                    "Trường không hợp lệ '" + ex.getPropertyName() + "'" + atPath(ex)
                            + ". Các trường được phép: " + knownProperties(ex) + ".");
        } catch (JsonMappingException ex) {
            throw new BadRequestException("Sai định dạng dữ liệu" + atPath(ex) + ": " + rootMessage(ex));
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("JSON không hợp lệ: " + rootMessage(ex));
        }
    }

    /**
     * Chuan hoa payload sang DTO dung chung voi duong import Word, kem danh sach loi/canh bao.
     * Khong nem exception khi du lieu sai - caller quyet dinh (preview thi tra ve, import thi chan).
     */
    public NormalizedImport normalize(QuestionJsonImportRequest payload) {
        NormalizedImport result = new NormalizedImport();

        if (payload.getVersion() != null && payload.getVersion() != 1) {
            result.warnings.add("version=" + payload.getVersion()
                    + " chưa được hỗ trợ, đang đọc theo version 1.");
        }

        Question.UsageScope scope = parseEnum(
                Question.UsageScope.class, payload.getUsageScope(), "usageScope", result.errors);
        if (scope != null) {
            result.usageScope = scope;
        }

        List<QuestionJsonImportRequest.JsonQuestion> flatQuestions =
                payload.getQuestions() == null ? List.of() : payload.getQuestions();
        List<QuestionJsonImportRequest.JsonGroup> groups =
                payload.getGroups() == null ? List.of() : payload.getGroups();

        if (flatQuestions.isEmpty() && groups.isEmpty()) {
            result.errors.add("File không có câu hỏi nào (cần 'questions' hoặc 'groups').");
            return result;
        }

        int total = flatQuestions.size()
                + groups.stream()
                .filter(Objects::nonNull)
                .map(QuestionJsonImportRequest.JsonGroup::getQuestions)
                .mapToInt(list -> list == null ? 0 : list.size())
                .sum();
        if (total > MAX_TOTAL_QUESTIONS) {
            result.errors.add("File có " + total + " câu hỏi, vượt giới hạn "
                    + MAX_TOTAL_QUESTIONS + " câu mỗi lần import.");
            return result;
        }

        for (int i = 0; i < flatQuestions.size(); i++) {
            NormalQuestionRequest question =
                    normalizeQuestion(flatQuestions.get(i), "questions[" + i + "]", result);
            if (question != null) {
                result.questions.add(question);
            }
        }

        for (int g = 0; g < groups.size(); g++) {
            String groupPath = "groups[" + g + "]";
            QuestionJsonImportRequest.JsonGroup group = groups.get(g);
            if (group == null) {
                result.errors.add(groupPath + ": nhóm rỗng.");
                continue;
            }

            PassageRequest passage = normalizePassage(group.getPassage(), groupPath, result);

            List<QuestionJsonImportRequest.JsonQuestion> rawQuestions =
                    group.getQuestions() == null ? List.of() : group.getQuestions();
            if (rawQuestions.isEmpty()) {
                result.errors.add(groupPath + ".questions: nhóm phải có ít nhất 1 câu hỏi.");
            }

            List<NormalQuestionRequest> groupQuestions = new ArrayList<>();
            for (int i = 0; i < rawQuestions.size(); i++) {
                NormalQuestionRequest question = normalizeQuestion(
                        rawQuestions.get(i), groupPath + ".questions[" + i + "]", result);
                if (question != null) {
                    groupQuestions.add(question);
                }
            }

            if (passage == null) {
                continue;
            }
            PassageQuestionGroupRequest normalizedGroup = new PassageQuestionGroupRequest();
            normalizedGroup.setPassage(passage);
            normalizedGroup.setQuestions(groupQuestions);
            result.groups.add(normalizedGroup);
        }

        warnDuplicateQuestionNumbers(result);
        return result;
    }

    private PassageRequest normalizePassage(
            QuestionJsonImportRequest.JsonPassage raw,
            String groupPath,
            NormalizedImport result
    ) {
        if (raw == null) {
            result.errors.add(groupPath + ".passage: thiếu đoạn văn / bài nghe.");
            return null;
        }

        String content = trimToNull(raw.getContent());
        String mediaUrl = trimToNull(raw.getMediaUrl());
        List<String> extraContents = raw.getExtraContents() == null
                ? List.of()
                : raw.getExtraContents().stream()
                .map(this::trimToNull)
                .filter(Objects::nonNull)
                .toList();

        if (content == null && mediaUrl == null && extraContents.isEmpty()) {
            result.errors.add(groupPath
                    + ".passage: phải có 'content', 'mediaUrl' hoặc 'extraContents'.");
            return null;
        }

        Passage.PassageType passageType = parseEnum(
                Passage.PassageType.class, raw.getPassageType(),
                groupPath + ".passage.passageType", result.errors);
        if (passageType == null && trimToNull(raw.getPassageType()) == null) {
            passageType = Passage.PassageType.READING;
            result.warnings.add(groupPath + ".passage: thiếu 'passageType', mặc định READING.");
        }

        PassageRequest passage = new PassageRequest();
        passage.setContent(content == null ? "" : content);
        passage.setContentTranslation(trimToNull(raw.getContentTranslation()));
        passage.setMediaUrl(mediaUrl);
        passage.setPassageType(passageType);
        passage.setExtraContents(extraContents.isEmpty() ? null : new ArrayList<>(extraContents));
        return passage;
    }

    private NormalQuestionRequest normalizeQuestion(
            QuestionJsonImportRequest.JsonQuestion raw,
            String path,
            NormalizedImport result
    ) {
        if (raw == null) {
            result.errors.add(path + ": câu hỏi rỗng.");
            return null;
        }

        String questionText = trimToNull(raw.getQuestionText());
        if (questionText == null) {
            result.errors.add(path + ".questionText: không được để trống.");
        }

        List<QuestionJsonImportRequest.JsonAnswer> rawAnswers =
                raw.getAnswers() == null ? List.of() : raw.getAnswers();

        Question.QuestionType questionType = parseEnum(
                Question.QuestionType.class, raw.getQuestionType(),
                path + ".questionType", result.errors);
        if (questionType == null) {
            if (trimToNull(raw.getQuestionType()) != null) {
                return null;
            }
            questionType = inferQuestionType(rawAnswers);
            result.warnings.add(path + ": thiếu 'questionType', suy ra " + questionType + ".");
        }

        List<AnswerRequest> answers = normalizeAnswers(rawAnswers, questionType, path, result);

        if (raw.getQuestionNumber() != null && raw.getQuestionNumber() <= 0) {
            result.errors.add(path + ".questionNumber: phải là số nguyên dương.");
        }

        NormalQuestionRequest question = new NormalQuestionRequest();
        question.setQuestionText(questionText == null ? "" : questionText);
        question.setQuestionType(questionType);
        question.setAnswers(answers);
        question.setExplanation(trimToNull(raw.getExplanation()));
        question.setCollectionId(trimToNull(raw.getCollectionId()));
        question.setTagIds(cleanStringList(raw.getTagIds()));
        question.setTagNames(cleanStringList(raw.getTagNames()));
        question.setQuestionNumber(raw.getQuestionNumber());
        question.setNeedsManualCorrect(false);
        return question;
    }

    private List<AnswerRequest> normalizeAnswers(
            List<QuestionJsonImportRequest.JsonAnswer> rawAnswers,
            Question.QuestionType questionType,
            String path,
            NormalizedImport result
    ) {
        if (rawAnswers.size() > MAX_ANSWERS_PER_QUESTION) {
            result.errors.add(path + ".answers: tối đa " + MAX_ANSWERS_PER_QUESTION
                    + " đáp án, đang có " + rawAnswers.size() + ".");
        }

        boolean anyLabelGiven = rawAnswers.stream()
                .anyMatch(a -> a != null && trimToNull(a.getAnswerLabel()) != null);

        List<AnswerRequest> answers = new ArrayList<>();
        Set<String> seenLabels = new LinkedHashSet<>();
        int correctCount = 0;

        for (int i = 0; i < rawAnswers.size(); i++) {
            String answerPath = path + ".answers[" + i + "]";
            QuestionJsonImportRequest.JsonAnswer raw = rawAnswers.get(i);
            if (raw == null) {
                result.errors.add(answerPath + ": đáp án rỗng.");
                continue;
            }

            String label = trimToNull(raw.getAnswerLabel());
            if (label == null) {
                label = i < DEFAULT_LABELS.size() ? DEFAULT_LABELS.get(i) : String.valueOf(i + 1);
                if (anyLabelGiven) {
                    result.warnings.add(answerPath
                            + ": thiếu 'answerLabel', gán tự động '" + label + "'.");
                }
            } else {
                label = label.toUpperCase(Locale.ROOT);
            }
            if (!seenLabels.add(label)) {
                result.errors.add(answerPath + ".answerLabel: nhãn '" + label + "' bị trùng.");
            }

            String text = trimToNull(raw.getAnswerText());
            if (text == null && isChoiceType(questionType)) {
                result.errors.add(answerPath + ".answerText: không được để trống.");
            }

            boolean correct = Boolean.TRUE.equals(raw.getIsCorrect());
            if (correct) {
                correctCount++;
            }

            answers.add(new AnswerRequest(null, text == null ? "" : text, correct, label));
        }

        switch (questionType) {
            case MCQ -> {
                if (answers.size() < 2) {
                    result.errors.add(path + ".answers: câu MCQ cần ít nhất 2 đáp án.");
                }
                if (correctCount == 0) {
                    result.errors.add(path + ".answers: câu MCQ phải có đúng 1 đáp án đúng"
                            + " (đánh dấu isCorrect = true).");
                } else if (correctCount > 1) {
                    result.errors.add(path + ".answers: câu MCQ chỉ được 1 đáp án đúng, đang có "
                            + correctCount + " (dùng questionType MSQ nếu muốn nhiều đáp án).");
                }
            }
            case MSQ -> {
                if (answers.size() < 2) {
                    result.errors.add(path + ".answers: câu MSQ cần ít nhất 2 đáp án.");
                }
                if (correctCount == 0) {
                    result.errors.add(path + ".answers: câu MSQ phải có ít nhất 1 đáp án đúng.");
                } else if (correctCount == 1) {
                    result.warnings.add(path
                            + ": câu MSQ chỉ có 1 đáp án đúng, kiểm tra lại xem có phải MCQ không.");
                }
            }
            case FILL_BLANK -> {
                if (answers.isEmpty()) {
                    result.errors.add(path + ".answers: câu FILL_BLANK cần ít nhất 1 đáp án đúng.");
                } else if (correctCount == 0) {
                    answers.forEach(answer -> answer.setIsCorrect(true));
                    result.warnings.add(path + ": câu FILL_BLANK không đánh dấu đáp án đúng,"
                            + " coi tất cả là đáp án được chấp nhận.");
                }
            }
            case ESSAY -> {
                if (answers.size() > 1) {
                    result.warnings.add(path + ": câu ESSAY chỉ dùng đáp án đầu tiên làm bài mẫu, "
                            + (answers.size() - 1) + " đáp án còn lại bị bỏ qua.");
                }
                answers.forEach(answer -> answer.setIsCorrect(true));
            }
        }

        return answers;
    }

    private Question.QuestionType inferQuestionType(
            List<QuestionJsonImportRequest.JsonAnswer> rawAnswers
    ) {
        if (rawAnswers.isEmpty()) {
            return Question.QuestionType.ESSAY;
        }
        long correctCount = rawAnswers.stream()
                .filter(answer -> answer != null && Boolean.TRUE.equals(answer.getIsCorrect()))
                .count();
        return correctCount >= 2 ? Question.QuestionType.MSQ : Question.QuestionType.MCQ;
    }

    private void warnDuplicateQuestionNumbers(NormalizedImport result) {
        List<NormalQuestionRequest> all = new ArrayList<>(result.questions);
        result.groups.forEach(group -> all.addAll(group.getQuestions()));

        Set<Integer> seen = new LinkedHashSet<>();
        Set<Integer> duplicated = new TreeSet<>();
        for (NormalQuestionRequest question : all) {
            Integer number = question.getQuestionNumber();
            if (number != null && number > 0 && !seen.add(number)) {
                duplicated.add(number);
            }
        }
        if (!duplicated.isEmpty()) {
            result.warnings.add("questionNumber bị trùng: "
                    + duplicated.stream().map(String::valueOf).collect(Collectors.joining(", "))
                    + ". Các câu trùng số sẽ nằm cùng vị trí trong ngân hàng câu hỏi.");
        }
    }

    private boolean isChoiceType(Question.QuestionType type) {
        return type == Question.QuestionType.MCQ || type == Question.QuestionType.MSQ;
    }

    private <E extends Enum<E>> E parseEnum(
            Class<E> type, String rawValue, String path, List<String> errors) {
        String value = trimToNull(rawValue);
        if (value == null) {
            return null;
        }
        try {
            return Enum.valueOf(type, value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            errors.add(path + ": giá trị '" + value + "' không hợp lệ. Chỉ nhận "
                    + Arrays.stream(type.getEnumConstants())
                    .map(Enum::name)
                    .collect(Collectors.joining(", ")) + ".");
            return null;
        }
    }

    private List<String> cleanStringList(List<String> values) {
        if (values == null) {
            return null;
        }
        List<String> cleaned = values.stream()
                .map(this::trimToNull)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        return cleaned.isEmpty() ? null : new ArrayList<>(cleaned);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String knownProperties(UnrecognizedPropertyException ex) {
        if (ex.getKnownPropertyIds() == null) {
            return "(không xác định)";
        }
        return ex.getKnownPropertyIds().stream()
                .map(String::valueOf)
                .sorted()
                .collect(Collectors.joining(", "));
    }

    private String atPath(JsonMappingException ex) {
        String path = ex.getPath().stream()
                .map(ref -> ref.getFieldName() != null
                        ? "." + ref.getFieldName()
                        : "[" + ref.getIndex() + "]")
                .collect(Collectors.joining());
        if (path.startsWith(".")) {
            path = path.substring(1);
        }
        return path.isEmpty() ? "" : " tại '" + path + "'";
    }

    private String rootMessage(JsonProcessingException ex) {
        String message = ex.getOriginalMessage();
        return message == null ? ex.getMessage() : message;
    }

    @Getter
    public static class NormalizedImport {
        private final List<NormalQuestionRequest> questions = new ArrayList<>();
        private final List<PassageQuestionGroupRequest> groups = new ArrayList<>();
        private final List<String> errors = new ArrayList<>();
        private final List<String> warnings = new ArrayList<>();
        private Question.UsageScope usageScope = Question.UsageScope.EXAM;

        public boolean isValid() {
            return errors.isEmpty();
        }

        public int totalQuestions() {
            return questions.size()
                    + groups.stream().mapToInt(group -> group.getQuestions().size()).sum();
        }

        /** Nem loi gop tat ca van de tim duoc, thay vi chi bao loi dau tien. */
        public void throwIfInvalid() {
            if (errors.isEmpty()) {
                return;
            }
            List<String> shown = errors.size() > MAX_REPORTED_ERRORS
                    ? errors.subList(0, MAX_REPORTED_ERRORS)
                    : errors;
            String suffix = errors.size() > MAX_REPORTED_ERRORS
                    ? " ... và " + (errors.size() - MAX_REPORTED_ERRORS) + " lỗi khác."
                    : "";
            throw new BadRequestException("File JSON có " + errors.size() + " lỗi: "
                    + String.join(" | ", shown) + suffix);
        }
    }
}
