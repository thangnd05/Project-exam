package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.BulkCreateQuestionsToBankRequest;
import com.project_exam.backend.modules.assessment.exam.dto.BulkPassageGroupRequest;
import com.project_exam.backend.modules.assessment.exam.dto.NormalQuestionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageQuestionGroupRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionJsonImportRequest;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.service.QuestionJsonImportService;
import com.project_exam.backend.modules.assessment.exam.service.QuestionService;
import com.project_exam.backend.modules.assessment.exam.service.TagService;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.dto.AddQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.CreateTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.TestJsonImportPreviewResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartRequest;
import com.project_exam.backend.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tạo trọn một đề từ file JSON (cùng format với import câu hỏi), trải trên nhiều phần thi.
 *
 * <p>Phần thi của mỗi câu lấy theo thứ tự: trường {@code examPart} của câu (tên hoặc id), trường
 * {@code examPart} của nhóm, rồi tiền tố tag dạng "Phần thi &gt; Tag". Loại kỳ thi chỉ có một phần
 * thi thì mọi câu thuộc phần đó. Mỗi phần thi có câu sẽ thành một test part theo thứ tự hiển thị
 * của phần thi; trong một part, câu giữ thứ tự trong file (câu độc lập trước, nhóm sau).
 */
@Service
@RequiredArgsConstructor
public class TestJsonImportService {

    private final QuestionJsonImportService questionJsonImportService;
    private final QuestionService questionService;
    private final TagService tagService;
    private final ExamPartRepository examPartRepository;
    private final QuestionRepository questionRepository;
    private final TestCommandService testCommandService;
    private final TestPartService testPartService;
    private final TestQuestionAssignmentService testQuestionAssignmentService;

    public TestJsonImportPreviewResponse preview(QuestionJsonImportRequest payload, String examTypeId) {
        Plan plan = plan(payload, examTypeId);
        List<String> warnings = new ArrayList<>(plan.normalized.getWarnings());
        if (plan.normalized.isValid()) {
            warnings.addAll(unresolvedTagWarnings(plan, examTypeId));
        }
        List<TestJsonImportPreviewResponse.PartSummary> parts = plan.buckets.values().stream()
                .map(b -> new TestJsonImportPreviewResponse.PartSummary(
                        b.part.getExamPartId(), b.part.getName(), b.questionCount(), b.groups.size(),
                        b.questions, b.groups))
                .toList();
        return new TestJsonImportPreviewResponse(
                plan.normalized.isValid(),
                plan.normalized.totalQuestions(),
                plan.normalized.getErrors(),
                warnings,
                parts
        );
    }

    @Transactional
    public Test importTest(
            CreateTestRequest request,
            QuestionJsonImportRequest payload,
            Question.UsageScope usageScope,
            String currentUserId
    ) throws IOException {
        if (request == null || isBlank(request.getExamTypeId())) {
            throw new BadRequestException("Thiếu loại kỳ thi (examTypeId).");
        }
        if (isBlank(request.getTitle())) {
            throw new BadRequestException("Thiếu tiêu đề đề thi.");
        }
        Plan plan = plan(payload, request.getExamTypeId());
        plan.normalized.throwIfInvalid();

        Question.UsageScope scope = usageScope != null ? usageScope : plan.normalized.getUsageScope();
        Test test = testCommandService.createTest(request, currentUserId);

        for (Bucket bucket : plan.buckets.values()) {
            String examPartId = bucket.part.getExamPartId();
            List<QuestionAdminResponse> created = new ArrayList<>(questionService.createBulkQuestionsToBankNoPassage(
                    new BulkCreateQuestionsToBankRequest(
                            examPartId, request.getClassId(), request.getChapterId(), bucket.questions, scope),
                    currentUserId,
                    Collections.emptyMap()
            ));
            if (!bucket.groups.isEmpty()) {
                BulkPassageGroupRequest groupRequest = new BulkPassageGroupRequest();
                groupRequest.setExamPartId(examPartId);
                groupRequest.setClassId(request.getClassId());
                groupRequest.setChapterId(request.getChapterId());
                groupRequest.setGroups(bucket.groups);
                groupRequest.setUsageScope(scope);
                created.addAll(questionService.createBulkGroups(groupRequest, currentUserId, Collections.emptyMap()));
            }

            TestPartRequest partRequest = new TestPartRequest();
            partRequest.setTestId(test.getTestId());
            partRequest.setExamPartId(examPartId);
            partRequest.setNumQuestions(created.size());
            TestPart testPart = testPartService.save(partRequest, currentUserId);

            List<String> questionIds = created.stream().map(QuestionAdminResponse::getQuestionId).toList();
            AddQuestionsToTestRequest attach = new AddQuestionsToTestRequest();
            attach.setTestPartId(testPart.getTestPartId());
            attach.setQuestionIds(questionIds);
            testQuestionAssignmentService.addQuestionsToTestPart(attach, currentUserId);

            // Giống câu nhập tay ở tab tạo đề: câu chỉ thuộc đề này, không vào kho để bị bốc
            // ngẫu nhiên khi tạo đề khác. Gắn vào đề xong mới tắt vì bước gắn kiểm tra quyền trên câu.
            List<Question> savedQuestions = questionRepository.findAllById(questionIds);
            savedQuestions.forEach(q -> q.setIsBank(Boolean.FALSE));
            questionRepository.saveAll(savedQuestions);
        }
        return test;
    }

    private Plan plan(QuestionJsonImportRequest payload, String examTypeId) {
        if (isBlank(examTypeId)) {
            throw new BadRequestException("Thiếu loại kỳ thi (examTypeId).");
        }
        List<ExamPart> parts = examPartRepository.findByExamTypeId(examTypeId).stream()
                .filter(p -> p.getDeletedAt() == null)
                .toList();
        if (parts.isEmpty()) {
            throw new BadRequestException("Loại kỳ thi này chưa có phần thi nào.");
        }

        QuestionJsonImportService.NormalizedImport normalized = questionJsonImportService.normalize(payload);
        Plan plan = new Plan(normalized);
        // Thứ tự part trong đề = thứ tự hiển thị của phần thi, không phụ thuộc thứ tự câu trong file.
        Map<String, Bucket> ordered = new LinkedHashMap<>();
        parts.forEach(p -> ordered.put(p.getExamPartId(), new Bucket(p)));
        if (!normalized.isValid()) {
            return plan;
        }

        String allowed = parts.stream().map(ExamPart::getName).collect(Collectors.joining(", "));
        List<String> errors = normalized.getErrors();

        // Sau khi normalize hợp lệ, danh sách đã chuẩn hoá khớp từng phần tử với danh sách gốc.
        List<QuestionJsonImportRequest.JsonQuestion> rawQuestions =
                payload.getQuestions() == null ? List.of() : payload.getQuestions();
        for (int i = 0; i < rawQuestions.size(); i++) {
            NormalQuestionRequest question = normalized.getQuestions().get(i);
            String path = "questions[" + i + "]";
            ExamPart part = resolvePart(rawQuestions.get(i).getExamPart(), question.getTagNames(), parts, path, errors);
            if (part == null) {
                if (!hasPartHint(rawQuestions.get(i).getExamPart(), question.getTagNames())) {
                    errors.add(path + ": không xác định được phần thi. Thêm 'examPart' hoặc tag dạng"
                            + " \"Phần thi > Tag\". Phần thi hợp lệ: " + allowed + ".");
                }
                continue;
            }
            ordered.get(part.getExamPartId()).questions.add(question);
        }

        List<QuestionJsonImportRequest.JsonGroup> rawGroups =
                payload.getGroups() == null ? List.of() : payload.getGroups();
        for (int g = 0; g < rawGroups.size(); g++) {
            QuestionJsonImportRequest.JsonGroup rawGroup = rawGroups.get(g);
            PassageQuestionGroupRequest group = normalized.getGroups().get(g);
            String path = "groups[" + g + "]";
            ExamPart part = resolveGroupPart(rawGroup, group, parts, path, errors);
            if (part == null) {
                continue;
            }
            ordered.get(part.getExamPartId()).groups.add(group);
        }

        if (!errors.isEmpty()) {
            return plan;
        }
        ordered.values().stream()
                .filter(b -> b.questionCount() > 0)
                .forEach(b -> plan.buckets.put(b.part.getExamPartId(), b));
        return plan;
    }

    private ExamPart resolveGroupPart(
            QuestionJsonImportRequest.JsonGroup rawGroup,
            PassageQuestionGroupRequest group,
            List<ExamPart> parts,
            String path,
            List<String> errors
    ) {
        if (!isBlank(rawGroup.getExamPart())) {
            return resolvePart(rawGroup.getExamPart(), null, parts, path, errors);
        }
        // Nhóm không khai báo phần thi: mọi câu trong nhóm phải chỉ về cùng một phần thi.
        List<QuestionJsonImportRequest.JsonQuestion> rawQuestions = rawGroup.getQuestions();
        Set<ExamPart> found = new LinkedHashSet<>();
        for (int i = 0; i < rawQuestions.size(); i++) {
            ExamPart part = resolvePart(rawQuestions.get(i).getExamPart(), group.getQuestions().get(i).getTagNames(),
                    parts, path + ".questions[" + i + "]", errors);
            if (part != null) {
                found.add(part);
            }
        }
        if (found.size() == 1) {
            return found.iterator().next();
        }
        if (found.isEmpty() && parts.size() == 1) {
            return parts.get(0);
        }
        errors.add(path + (found.isEmpty()
                ? ": không xác định được phần thi. Thêm 'examPart' cho nhóm."
                : ": các câu trong nhóm thuộc nhiều phần thi ("
                + found.stream().map(ExamPart::getName).collect(Collectors.joining(", "))
                + "). Một nhóm chỉ thuộc một phần thi; thêm 'examPart' cho nhóm."));
        return null;
    }

    /**
     * Trả về null khi không xác định được. Chỉ ghi lỗi khi có gợi ý nhưng gợi ý sai
     * (tên phần thi không tồn tại, tag chỉ về nhiều phần thi khác nhau).
     */
    private ExamPart resolvePart(
            String explicit,
            List<String> tagNames,
            List<ExamPart> parts,
            String path,
            List<String> errors
    ) {
        if (!isBlank(explicit)) {
            ExamPart part = findPart(explicit, parts);
            if (part == null) {
                errors.add(path + ".examPart: không có phần thi '" + explicit.trim() + "'. Phần thi hợp lệ: "
                        + parts.stream().map(ExamPart::getName).collect(Collectors.joining(", ")) + ".");
            }
            return part;
        }

        Set<ExamPart> fromTags = new LinkedHashSet<>();
        Set<String> unknownPrefixes = new LinkedHashSet<>();
        for (String spec : tagNames == null ? List.<String>of() : tagNames) {
            int gt = spec.indexOf('>');
            if (gt < 0) {
                continue;
            }
            String prefix = spec.substring(0, gt).trim();
            ExamPart part = findPart(prefix, parts);
            if (part == null) {
                unknownPrefixes.add(prefix);
            } else {
                fromTags.add(part);
            }
        }
        if (fromTags.size() > 1) {
            errors.add(path + ".tagNames: tag thuộc nhiều phần thi ("
                    + fromTags.stream().map(ExamPart::getName).collect(Collectors.joining(", "))
                    + "). Thêm 'examPart' để chọn phần thi cho câu này.");
            return null;
        }
        if (fromTags.size() == 1) {
            return fromTags.iterator().next();
        }
        if (parts.size() == 1) {
            return parts.get(0);
        }
        if (!unknownPrefixes.isEmpty()) {
            errors.add(path + ".tagNames: không có phần thi '" + String.join("', '", unknownPrefixes)
                    + "'. Phần thi hợp lệ: "
                    + parts.stream().map(ExamPart::getName).collect(Collectors.joining(", ")) + ".");
        }
        return null;
    }

    private boolean hasPartHint(String explicit, List<String> tagNames) {
        return !isBlank(explicit)
                || (tagNames != null && tagNames.stream().anyMatch(t -> t.contains(">")));
    }

    private ExamPart findPart(String nameOrId, List<ExamPart> parts) {
        String key = nameOrId.trim();
        return parts.stream()
                .filter(p -> key.equals(p.getExamPartId())
                        || (p.getName() != null && p.getName().trim().equalsIgnoreCase(key)))
                .findFirst()
                .orElse(null);
    }

    /** Tag không khớp sẽ bị bỏ qua lúc import, nên báo trước ở bước preview. */
    private List<String> unresolvedTagWarnings(Plan plan, String examTypeId) {
        List<String> warnings = new ArrayList<>();
        for (Bucket bucket : plan.buckets.values()) {
            Set<String> specs = new LinkedHashSet<>();
            bucket.questions.forEach(q -> addAll(specs, q.getTagNames()));
            bucket.groups.forEach(g -> g.getQuestions().forEach(q -> addAll(specs, q.getTagNames())));
            if (specs.isEmpty()) {
                continue;
            }
            TagService.TagNameResolution resolution =
                    tagService.resolveTagNames(specs, examTypeId, bucket.part.getExamPartId());
            if (!resolution.unmatched().isEmpty()) {
                warnings.add(bucket.part.getName() + ": " + resolution.unmatched().size()
                        + " tag không có trong hệ thống, sẽ bị bỏ qua: " + String.join(" | ", resolution.unmatched()));
            }
            if (!resolution.ambiguous().isEmpty()) {
                warnings.add(bucket.part.getName() + ": tag trùng tên, sẽ bị bỏ qua: "
                        + String.join(" | ", resolution.ambiguous()));
            }
        }
        return warnings;
    }

    private void addAll(Set<String> target, Collection<String> values) {
        if (values != null) {
            values.stream().filter(Objects::nonNull).forEach(target::add);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static class Plan {
        private final QuestionJsonImportService.NormalizedImport normalized;
        private final Map<String, Bucket> buckets = new LinkedHashMap<>();

        private Plan(QuestionJsonImportService.NormalizedImport normalized) {
            this.normalized = normalized;
        }
    }

    private static class Bucket {
        private final ExamPart part;
        private final List<NormalQuestionRequest> questions = new ArrayList<>();
        private final List<PassageQuestionGroupRequest> groups = new ArrayList<>();

        private Bucket(ExamPart part) {
            this.part = part;
        }

        private int questionCount() {
            return questions.size() + groups.stream().mapToInt(g -> g.getQuestions().size()).sum();
        }
    }
}
