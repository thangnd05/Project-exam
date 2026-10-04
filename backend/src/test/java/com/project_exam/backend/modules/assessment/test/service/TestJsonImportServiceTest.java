package com.project_exam.backend.modules.assessment.test.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.service.QuestionJsonImportService;
import com.project_exam.backend.modules.assessment.exam.service.TagService;
import com.project_exam.backend.modules.assessment.test.dto.TestJsonImportPreviewResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TestJsonImportServiceTest {

    private static final String EXAM_TYPE = "saa";

    private final QuestionJsonImportService jsonService = new QuestionJsonImportService(new ObjectMapper());
    private final ExamPartRepository examPartRepository = mock(ExamPartRepository.class);
    private final TagService tagService = mock(TagService.class);
    private TestJsonImportService service;

    @BeforeEach
    void setUp() {
        when(examPartRepository.findByExamTypeId(EXAM_TYPE)).thenReturn(List.of(
                part("p1", "Secure Architectures"),
                part("p2", "Resilient Architectures"),
                part("p3", "High-Performing Architectures"),
                part("p4", "Cost-Optimized Architectures")));
        when(tagService.resolveTagNames(any(), anyString(), anyString()))
                .thenReturn(new TagService.TagNameResolution(List.of(), List.of(), List.of()));
        service = new TestJsonImportService(jsonService, null, tagService, examPartRepository, null, null, null, null);
    }

    private static ExamPart part(String id, String name) {
        ExamPart p = new ExamPart();
        p.setExamPartId(id);
        p.setName(name);
        p.setExamTypeId(EXAM_TYPE);
        return p;
    }

    private static String question(String extra) {
        return """
                { "questionText": "Q", %s
                  "answers": [ { "text": "a", "correct": true }, { "text": "b" } ] }
                """.formatted(extra);
    }

    private TestJsonImportPreviewResponse preview(String json) {
        return service.preview(jsonService.parse(json), EXAM_TYPE);
    }

    @Test
    @DisplayName("Chia câu theo tiền tố tag và examPart, part theo thứ tự phần thi")
    void splitsQuestionsByDomain() {
        var result = preview("""
                { "questions": [
                  %s, %s, %s, %s
                ] }
                """.formatted(
                question("\"tagNames\": [\"Cost-Optimized Architectures > AWS-Cost-Explorer\"],"),
                question("\"tagNames\": [\"secure architectures > IAM\"],"),
                question("\"examPart\": \"Resilient Architectures\","),
                question("\"tags\": [\"Secure Architectures > AWS-KMS\"],")));

        assertTrue(result.isValid(), () -> "errors: " + result.getErrors());
        assertEquals(4, result.getQuestionCount());
        assertEquals(List.of("Secure Architectures", "Resilient Architectures", "Cost-Optimized Architectures"),
                result.getParts().stream().map(TestJsonImportPreviewResponse.PartSummary::getExamPartName).toList());
        assertEquals(List.of(2, 1, 1),
                result.getParts().stream().map(TestJsonImportPreviewResponse.PartSummary::getQuestionCount).toList());
    }

    @Test
    @DisplayName("Câu không xác định được phần thi hoặc tag chỉ về nhiều phần thi thì báo lỗi")
    void reportsUnresolvedParts() {
        var result = preview("""
                { "questions": [ %s, %s, %s ] }
                """.formatted(
                question("\"tagNames\": [\"IAM\"],"),
                question("\"tagNames\": [\"Secure Architectures > IAM\", \"Resilient Architectures > ELB\"],"),
                question("\"examPart\": \"Networking\",")));

        assertFalse(result.isValid());
        assertEquals(3, result.getErrors().size(), () -> "errors: " + result.getErrors());
        assertTrue(result.getErrors().get(0).startsWith("questions[0]"));
        assertTrue(result.getErrors().get(1).startsWith("questions[1].tagNames"));
        assertTrue(result.getErrors().get(2).startsWith("questions[2].examPart"));
        assertTrue(result.getParts().isEmpty());
    }

    @Test
    @DisplayName("File mẫu docs/saa-c03/exam-sample-65.json chia đủ 4 domain")
    void sampleExamFileSplitsIntoFourParts() throws IOException {
        Path sample = Path.of("..", "docs", "saa-c03", "exam-sample-65.json");
        assumeTrue(Files.exists(sample), "không chạy từ thư mục backend");

        var result = preview(Files.readString(sample, StandardCharsets.UTF_8));

        assertTrue(result.isValid(), () -> "errors: " + result.getErrors());
        assertEquals(List.of(19, 17, 16, 13),
                result.getParts().stream().map(TestJsonImportPreviewResponse.PartSummary::getQuestionCount).toList());
    }

    @Test
    @DisplayName("Đề nhanh docs/saa-c03/quick-test-22.json chia 7/6/5/4 theo domain")
    void quickTestFileSplitsByDomainWeight() throws IOException {
        Path sample = Path.of("..", "docs", "saa-c03", "quick-test-22.json");
        assumeTrue(Files.exists(sample), "không chạy từ thư mục backend");

        var result = preview(Files.readString(sample, StandardCharsets.UTF_8));

        assertTrue(result.isValid(), () -> "errors: " + result.getErrors());
        assertTrue(result.getWarnings().isEmpty(), () -> "warnings: " + result.getWarnings());
        assertEquals(List.of(7, 6, 5, 4),
                result.getParts().stream().map(TestJsonImportPreviewResponse.PartSummary::getQuestionCount).toList());
    }

    @Test
    @DisplayName("Tag không có trong hệ thống được báo trước ở preview")
    void warnsUnmatchedTags() {
        when(tagService.resolveTagNames(any(), anyString(), anyString()))
                .thenReturn(new TagService.TagNameResolution(List.of(), List.of("Secure Architectures > Typo"), List.of()));

        var result = preview("""
                { "questions": [ %s ] }
                """.formatted(question("\"questionType\": \"MCQ\", \"tagNames\": [\"Secure Architectures > Typo\"],")));

        assertTrue(result.isValid(), () -> "errors: " + result.getErrors());
        assertTrue(result.getWarnings().stream().anyMatch(w -> w.contains("Typo")), () -> "warnings: " + result.getWarnings());
    }
}
