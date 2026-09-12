package com.project_exam.backend.modules.assessment.exam.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.NormalQuestionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionJsonImportRequest;
import com.project_exam.backend.shared.exception.BadRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class QuestionJsonImportServiceTest {

    private final QuestionJsonImportService service =
            new QuestionJsonImportService(new ObjectMapper());

    private QuestionJsonImportService.NormalizedImport normalize(String json) {
        return service.normalize(service.parse(json));
    }

    @Test
    @DisplayName("Dạng ngắn: tự suy ra MCQ và gán nhãn A, B, C, D")
    void infersTypeAndLabels() {
        var result = normalize("""
                {
                  "questions": [
                    {
                      "questionText": "2 + 2 = ?",
                      "answers": [
                        { "text": "3", "correct": false },
                        { "text": "4", "correct": true },
                        { "text": "5", "correct": false },
                        { "text": "6", "correct": false }
                      ]
                    }
                  ]
                }
                """);

        assertTrue(result.isValid(), () -> "errors: " + result.getErrors());
        assertEquals(1, result.totalQuestions());

        NormalQuestionRequest question = result.getQuestions().get(0);
        assertEquals(Question.QuestionType.MCQ, question.getQuestionType());
        assertEquals(
                java.util.List.of("A", "B", "C", "D"),
                question.getAnswers().stream().map(a -> a.getAnswerLabel()).toList());
        assertEquals("4", question.getAnswers().get(1).getAnswerText());
        assertFalse(result.getWarnings().isEmpty(), "phải cảnh báo vì thiếu questionType");
    }

    @Test
    @DisplayName("Nhiều đáp án đúng cho MCQ là lỗi, và lỗi chỉ đúng vị trí")
    void rejectsMultipleCorrectForMcq() {
        var result = normalize("""
                {
                  "questions": [
                    {
                      "questionType": "MCQ",
                      "questionText": "Câu sai",
                      "answers": [
                        { "text": "a", "correct": true },
                        { "text": "b", "correct": true }
                      ]
                    }
                  ]
                }
                """);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().get(0).startsWith("questions[0].answers"),
                () -> "errors: " + result.getErrors());
        assertThrows(BadRequestException.class, result::throwIfInvalid);
    }

    @Test
    @DisplayName("Báo về tất cả lỗi trong file, không dừng ở lỗi đầu tiên")
    void collectsEveryError() {
        var result = normalize("""
                {
                  "questions": [
                    { "questionType": "MCQ", "questionText": "",
                      "answers": [ { "text": "a", "correct": true }, { "text": "b" } ] },
                    { "questionType": "MSQ", "questionText": "Thiếu đáp án đúng",
                      "answers": [ { "text": "a" }, { "text": "b" } ] },
                    { "questionType": "MCQ", "questionText": "Nhãn trùng",
                      "answers": [ { "label": "A", "text": "a", "correct": true },
                                   { "label": "A", "text": "b" } ] }
                  ]
                }
                """);

        assertEquals(3, result.getErrors().size(), () -> "errors: " + result.getErrors());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("questions[0].questionText")));
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("questions[1].answers")));
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("questions[2].answers[1].answerLabel")));
    }

    @Test
    @DisplayName("Gõ sai tên trường bị chặn, không âm thầm bỏ qua")
    void rejectsUnknownProperty() {
        BadRequestException ex = assertThrows(BadRequestException.class, () -> normalize("""
                {
                  "questions": [
                    { "questionText": "x", "answers": [ { "text": "a", "isCorect": true } ] }
                  ]
                }
                """));

        assertTrue(ex.getMessage().contains("isCorect"), ex.getMessage());
        assertTrue(ex.getMessage().contains("isCorrect"), ex.getMessage());
    }

    @Test
    @DisplayName("questionType lạ báo rõ các giá trị được phép")
    void rejectsUnknownQuestionType() {
        var result = normalize("""
                {
                  "questions": [
                    { "questionType": "TRUE_FALSE", "questionText": "x",
                      "answers": [ { "text": "a", "correct": true }, { "text": "b" } ] }
                  ]
                }
                """);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().get(0).contains("MCQ, MSQ, FILL_BLANK, ESSAY"),
                () -> "errors: " + result.getErrors());
    }

    @Test
    @DisplayName("Nhóm theo đoạn văn: passage rỗng là lỗi, có mediaUrl thì hợp lệ")
    void validatesPassageGroups() {
        var invalid = normalize("""
                {
                  "groups": [
                    { "passage": { "passageType": "READING" },
                      "questions": [ { "questionText": "x",
                        "answers": [ { "text": "a", "correct": true }, { "text": "b" } ] } ] }
                  ]
                }
                """);
        assertFalse(invalid.isValid());
        assertTrue(invalid.getErrors().get(0).contains("groups[0].passage"),
                () -> "errors: " + invalid.getErrors());

        var valid = normalize("""
                {
                  "groups": [
                    { "passage": { "passageType": "LISTENING", "mediaUrl": "https://cdn/a.mp3" },
                      "questions": [ { "questionType": "MCQ", "questionText": "x",
                        "answers": [ { "text": "a", "correct": true }, { "text": "b" } ] } ] }
                  ]
                }
                """);
        assertTrue(valid.isValid(), () -> "errors: " + valid.getErrors());
        assertEquals(1, valid.getGroups().size());
        assertEquals(Passage.PassageType.LISTENING, valid.getGroups().get(0).getPassage().getPassageType());
        assertEquals(1, valid.totalQuestions());
    }

    @Test
    @DisplayName("FILL_BLANK không đánh dấu đáp án đúng thì coi tất cả là đáp án chấp nhận được")
    void fillBlankDefaultsAllAnswersCorrect() {
        var result = normalize("""
                {
                  "questions": [
                    { "questionType": "FILL_BLANK", "questionText": "She has lived here ___ 2010.",
                      "answers": [ { "text": "since" }, { "text": "Since" } ] }
                  ]
                }
                """);

        assertTrue(result.isValid(), () -> "errors: " + result.getErrors());
        assertTrue(result.getQuestions().get(0).getAnswers().stream()
                .allMatch(answer -> Boolean.TRUE.equals(answer.getIsCorrect())));
    }

    @Test
    @DisplayName("File không có câu hỏi nào bị từ chối")
    void rejectsEmptyPayload() {
        var result = normalize("{}");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().get(0).contains("questions"), () -> "errors: " + result.getErrors());
    }

    @Test
    @DisplayName("Output của /preview/document import lại được nguyên dạng")
    void acceptsWordPreviewShape() {
        var result = normalize("""
                {
                  "questions": [
                    {
                      "questionText": "Câu từ file Word",
                      "questionType": "MCQ",
                      "needsManualCorrect": false,
                      "collectionId": null,
                      "explanation": null,
                      "tagIds": null,
                      "tagNames": null,
                      "questionNumber": 1,
                      "answers": [
                        { "answerId": null, "answerText": "a", "isCorrect": true, "answerLabel": "A", "questionId": null },
                        { "answerId": null, "answerText": "b", "isCorrect": false, "answerLabel": "B", "questionId": null }
                      ]
                    }
                  ]
                }
                """);

        assertTrue(result.isValid(), () -> "errors: " + result.getErrors());
    }

    @Test
    @DisplayName("File mẫu trong docs/ phải luôn import được")
    void sampleFilesStayValid() throws IOException {
        for (String name : new String[]{"question-import-sample.json", "question-import-sample-minimal.json"}) {
            Path path = Path.of("..", "docs", name);
            assumeTrue(Files.exists(path), "không tìm thấy " + path);

            var result = normalize(Files.readString(path, StandardCharsets.UTF_8));
            assertTrue(result.isValid(), () -> name + " errors: " + result.getErrors());
            assertTrue(result.totalQuestions() > 0, name);
        }
    }

    @Test
    @DisplayName("File mẫu đầy đủ bao trùm cả 4 loại câu hỏi")
    void fullSampleCoversEveryQuestionType() throws IOException {
        Path path = Path.of("..", "docs", "question-import-sample.json");
        assumeTrue(Files.exists(path), "không tìm thấy " + path);

        QuestionJsonImportRequest payload = service.parse(Files.readString(path, StandardCharsets.UTF_8));
        var result = service.normalize(payload);

        var types = result.getQuestions().stream()
                .map(NormalQuestionRequest::getQuestionType)
                .collect(java.util.stream.Collectors.toSet());
        assertTrue(types.containsAll(java.util.Set.of(
                Question.QuestionType.MCQ,
                Question.QuestionType.MSQ,
                Question.QuestionType.FILL_BLANK,
                Question.QuestionType.ESSAY)), () -> "types: " + types);
        assertEquals(2, result.getGroups().size());
    }
}
