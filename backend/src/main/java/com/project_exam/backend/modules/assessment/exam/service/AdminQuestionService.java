package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.domain.QuestionCollection;
import com.project_exam.backend.modules.assessment.exam.domain.QuestionTag;
import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.dto.AdminQuestionListItemResponse;
import com.project_exam.backend.modules.assessment.exam.dto.BulkUpdateQuestionsRequest;
import com.project_exam.backend.modules.assessment.exam.dto.BulkUpdateQuestionsResponse;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionCollectionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Màn quản lý câu hỏi của admin: duyệt toàn bộ ngân hàng có phân trang + lọc,
 * và sửa hàng loạt các thuộc tính chung.
 *
 * Tách khỏi {@link QuestionService} vì đây là góc nhìn quản trị: KHÔNG áp
 * usage_scope theo luồng như hai nhánh ra đề / ôn tập - admin phải nhìn thấy
 * mọi câu thì mới gắn nhãn lại được.
 */
@Service
@RequiredArgsConstructor
public class AdminQuestionService {

    /** Chặn client gửi size quá lớn kéo sập bảng. */
    private static final int MAX_PAGE_SIZE = 100;

    /** Giá trị collectionId đặc biệt để lọc riêng nhóm câu chưa xếp bộ sưu tập. */
    public static final String UNCLASSIFIED = "__NONE__";

    private final QuestionRepository questionRepository;
    private final ExamPartRepository examPartRepository;
    private final ExamTypeRepository examTypeRepository;
    private final QuestionCollectionRepository questionCollectionRepository;
    private final QuestionTagRepository questionTagRepository;
    private final TagRepository tagRepository;

    // ------------------------------------------------------------------ tra cứu

    public PageResponse<AdminQuestionListItemResponse> search(
            String examTypeId,
            String examPartId,
            String collectionId,
            Question.UsageScope usageScope,
            Question.QuestionType questionType,
            Boolean isBank,
            String keyword,
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, MAX_PAGE_SIZE);

        Set<String> partIdScope = resolvePartIdScope(examTypeId, examPartId);
        if (partIdScope != null && partIdScope.isEmpty()) {
            // Loại đề được chọn chưa có Part nào -> chắc chắn không có câu nào.
            return PageResponse.empty(safePage, safeSize);
        }

        Specification<Question> spec = buildSpec(
                partIdScope, collectionId, usageScope, questionType, isBank, keyword);

        Pageable pageable = PageRequest.of(safePage, safeSize,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "questionId")));

        Page<Question> pageResult = questionRepository.findAll(spec, pageable);
        return PageResponse.from(pageResult, toListItems(pageResult.getContent()));
    }

    /**
     * null = không lọc theo Part. Tập rỗng = có lọc nhưng không Part nào khớp.
     */
    private Set<String> resolvePartIdScope(String examTypeId, String examPartId) {
        if (isBlank(examTypeId) && isBlank(examPartId)) {
            return null;
        }
        if (!isBlank(examPartId)) {
            return Set.of(examPartId);
        }
        return examPartRepository.findByExamTypeId(examTypeId).stream()
                .map(ExamPart::getExamPartId)
                .collect(Collectors.toSet());
    }

    private Specification<Question> buildSpec(
            Set<String> partIdScope,
            String collectionId,
            Question.UsageScope usageScope,
            Question.QuestionType questionType,
            Boolean isBank,
            String keyword
    ) {
        Specification<Question> spec = Specification.where(null);

        if (partIdScope != null) {
            spec = spec.and((root, query, cb) -> root.get("examPartId").in(partIdScope));
        }
        if (UNCLASSIFIED.equals(collectionId)) {
            spec = spec.and((root, query, cb) -> cb.isNull(root.get("collectionId")));
        } else if (!isBlank(collectionId)) {
            // Chọn bộ sưu tập cha thì lấy luôn câu của các bộ con, khớp cách
            // TestService/TestQuestionAssignmentService đang gom collection.
            Set<String> scope = collectionWithChildrenIds(collectionId);
            spec = spec.and((root, query, cb) -> root.get("collectionId").in(scope));
        }
        if (usageScope != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("usageScope"), usageScope));
        }
        if (questionType != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("questionType"), questionType));
        }
        if (isBank != null) {
            spec = isBank
                    ? spec.and((root, query, cb) -> cb.isTrue(root.get("isBank")))
                    // is_bank nullable: "không thuộc kho" gồm cả FALSE lẫn NULL.
                    : spec.and((root, query, cb) -> cb.or(
                            cb.isFalse(root.get("isBank")),
                            cb.isNull(root.get("isBank"))));
        }
        if (!isBlank(keyword)) {
            String needle = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("questionText")), needle));
        }
        return spec;
    }

    private Set<String> collectionWithChildrenIds(String collectionId) {
        Set<String> ids = new HashSet<>();
        ids.add(collectionId);
        questionCollectionRepository.findByParentId(collectionId)
                .forEach(child -> ids.add(child.getCollectionId()));
        return ids;
    }

    // ------------------------------------------------------- dựng dòng cho bảng

    /**
     * Nạp tên Part / loại đề / bộ sưu tập / tag theo lô. Bảng 20 dòng mà tra từng
     * dòng thì thành 80 query, nên tất cả đều gom bằng findAllById / findByIn.
     */
    private List<AdminQuestionListItemResponse> toListItems(List<Question> questions) {
        if (questions.isEmpty()) {
            return List.of();
        }

        Map<String, ExamPart> partById = indexById(
                examPartRepository.findAllById(idsOf(questions, Question::getExamPartId)),
                ExamPart::getExamPartId);

        Map<String, ExamType> typeById = indexById(
                examTypeRepository.findAllById(partById.values().stream()
                        .map(ExamPart::getExamTypeId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet())),
                ExamType::getExamTypeId);

        Map<String, QuestionCollection> collectionById = indexById(
                questionCollectionRepository.findAllById(idsOf(questions, Question::getCollectionId)),
                QuestionCollection::getCollectionId);

        Map<String, List<String>> tagNamesByQuestionId = loadTagNames(questions);

        return questions.stream().map(q -> {
            ExamPart part = q.getExamPartId() == null ? null : partById.get(q.getExamPartId());
            ExamType type = part == null || part.getExamTypeId() == null
                    ? null : typeById.get(part.getExamTypeId());
            QuestionCollection collection = q.getCollectionId() == null
                    ? null : collectionById.get(q.getCollectionId());

            return AdminQuestionListItemResponse.builder()
                    .questionId(q.getQuestionId())
                    .questionNumber(q.getQuestionNumber())
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType())
                    .usageScope(q.getUsageScope())
                    .isBank(q.getIsBank())
                    .createdAt(q.getCreatedAt())
                    .examPartId(q.getExamPartId())
                    .examPartName(part == null ? null : part.getName())
                    .examTypeId(part == null ? null : part.getExamTypeId())
                    .examTypeName(type == null ? null : type.getName())
                    .collectionId(q.getCollectionId())
                    .collectionName(collection == null ? null : collection.getName())
                    .tagNames(tagNamesByQuestionId.getOrDefault(q.getQuestionId(), List.of()))
                    .build();
        }).toList();
    }

    private Map<String, List<String>> loadTagNames(List<Question> questions) {
        List<String> questionIds = questions.stream().map(Question::getQuestionId).toList();
        List<QuestionTag> links = questionTagRepository.findByQuestionIdIn(questionIds);
        if (links.isEmpty()) {
            return Map.of();
        }
        Map<String, String> tagNameById = tagRepository
                .findAllById(links.stream().map(QuestionTag::getTagId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Tag::getTagId, Tag::getName));

        return links.stream()
                .filter(link -> tagNameById.containsKey(link.getTagId()))
                .collect(Collectors.groupingBy(
                        QuestionTag::getQuestionId,
                        Collectors.mapping(link -> tagNameById.get(link.getTagId()), Collectors.toList())));
    }

    private static Set<String> idsOf(List<Question> questions, Function<Question, String> getter) {
        return questions.stream()
                .map(getter)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private static <T> Map<String, T> indexById(Iterable<T> rows, Function<T, String> idGetter) {
        Map<String, T> map = new java.util.HashMap<>();
        rows.forEach(row -> map.put(idGetter.apply(row), row));
        return map;
    }

    // --------------------------------------------------------- sửa hàng loạt

    @Transactional
    public BulkUpdateQuestionsResponse bulkUpdate(BulkUpdateQuestionsRequest request) {
        Set<String> requestedIds = new LinkedHashSet<>(
                request.getQuestionIds() == null ? List.of() : request.getQuestionIds());
        if (requestedIds.isEmpty()) {
            throw new BadRequestException("Chưa chọn câu hỏi nào.");
        }
        if (requestedIds.size() > MAX_PAGE_SIZE) {
            throw new BadRequestException(
                    "Mỗi lần chỉ sửa tối đa " + MAX_PAGE_SIZE + " câu.");
        }

        boolean clearCollection = Boolean.TRUE.equals(request.getClearCollection());
        boolean setCollection = !clearCollection && !isBlank(request.getCollectionId());

        if (request.getUsageScope() == null
                && !clearCollection
                && !setCollection
                && request.getIsBank() == null) {
            throw new BadRequestException("Chưa chọn thuộc tính nào để sửa.");
        }

        if (setCollection && !questionCollectionRepository.existsById(request.getCollectionId())) {
            throw new BadRequestException("Bộ sưu tập không tồn tại.");
        }

        List<Question> found = questionRepository.findAllById(requestedIds);
        for (Question question : found) {
            if (request.getUsageScope() != null) {
                question.setUsageScope(request.getUsageScope());
            }
            if (clearCollection) {
                question.setCollectionId(null);
            } else if (setCollection) {
                question.setCollectionId(request.getCollectionId());
            }
            if (request.getIsBank() != null) {
                question.setIsBank(request.getIsBank());
            }
        }
        questionRepository.saveAll(found);

        Set<String> foundIds = found.stream().map(Question::getQuestionId).collect(Collectors.toSet());
        List<String> missing = requestedIds.stream().filter(id -> !foundIds.contains(id)).toList();

        return BulkUpdateQuestionsResponse.builder()
                .updatedCount(found.size())
                .missingQuestionIds(missing)
                .build();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    /** Dùng cho thanh thống kê phía trên bảng. */
    public Map<String, Long> countByUsageScope(Collection<Question.UsageScope> scopes) {
        return scopes.stream().collect(Collectors.toMap(
                Enum::name,
                scope -> questionRepository.count(
                        (root, query, cb) -> cb.equal(root.get("usageScope"), scope))));
    }
}
