package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.mapper.ExamTypeMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.infrastructure.cache.CacheNames;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ExamTypeService {

    private final ExamTypeRepository examTypeRepository;
    private final ExamTypeMapper examTypeMapper;
    private final ExamPartRepository examPartRepository;
    private final TestRepository testRepository;

    // Mỗi phần tử tốn thêm 2 truy vấn (cha, số con) và trang nào cũng gọi nên cache cả danh sách.
    @Cacheable(cacheNames = CacheNames.EXAM_TYPES, key = "'all'", sync = true)
    public List<ExamTypeResponse> findAll() {
        return examTypeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Cacheable(cacheNames = CacheNames.EXAM_TYPES, key = "'standard'", sync = true)
    public List<ExamTypeResponse> findStandard() {
        return examTypeRepository.findStandard().stream()
                .map(this::toResponse)
                .toList();
    }

    @Cacheable(cacheNames = CacheNames.EXAM_TYPES, key = "'flexible'", sync = true)
    public List<ExamTypeResponse> findFlexible() {
        return examTypeRepository.findFlexible().stream()
                .map(this::toResponse)
                .toList();
    }

    @Cacheable(cacheNames = CacheNames.EXAM_TYPES, key = "'children:' + #parentId", sync = true)
    public List<ExamTypeResponse> findChildren(String parentId) {
        return examTypeRepository.findByParentId(parentId).stream()
                .map(this::toResponse)
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    @Cacheable(cacheNames = CacheNames.EXAM_TYPE, key = "'id:' + #id", sync = true)
    public ExamTypeResponse findById(String id) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        return toResponse(type);
    }

    @Cacheable(cacheNames = CacheNames.EXAM_TYPE,
            key = "'slug:' + #slug.toLowerCase(T(java.util.Locale).ROOT)", sync = true)
    public ExamTypeResponse findBySlug(String slug) {
        ExamType type = examTypeRepository.findBySlug(slug.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        return toResponse(type);
    }

    public ExamTypeResponse create(ExamTypeRequest request) {
        ExamType type = new ExamType();
        type.setName(request.getName());
        type.setSlug(validateSlug(request.getSlug(), null));
        type.setDescription(request.getDescription());
        type.setImageUrl(request.getImageUrl());
        type.setDurationMinutes(request.getDurationMinutes());
        type.setScoringMethod(request.getScoringMethod() != null ? request.getScoringMethod() : "DEFAULT");
        if (request.getScoreMin() != null) type.setScoreMin(request.getScoreMin());
        if (request.getScoreMax() != null) type.setScoreMax(request.getScoreMax());
        validateScoreScale(type);
        type.setFlexible(Boolean.TRUE.equals(request.getFlexible()));
        type.setParentId(resolveParentId(request.getParentId(), null));
        type = examTypeRepository.save(type);
        return toResponse(type);
    }

    public ExamTypeResponse update(String id, ExamTypeRequest request) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        if (request.getName() != null) type.setName(request.getName());
        // Đổi tên không đổi slug để link cũ còn dùng được; chỉ đổi khi admin gửi slug.
        if (request.getSlug() != null) type.setSlug(validateSlug(request.getSlug(), id));
        if (request.getDescription() != null) type.setDescription(request.getDescription());
        if (request.getImageUrl() != null) type.setImageUrl(request.getImageUrl());
        if (request.getDurationMinutes() != null) type.setDurationMinutes(request.getDurationMinutes());
        if (request.getScoringMethod() != null) type.setScoringMethod(request.getScoringMethod());
        if (request.getScoreMin() != null) type.setScoreMin(request.getScoreMin());
        if (request.getScoreMax() != null) type.setScoreMax(request.getScoreMax());
        validateScoreScale(type);
        if (request.getFlexible() != null) type.setFlexible(request.getFlexible());

        if (request.getParentId() != null) {
            type.setParentId(resolveParentId(request.getParentId(), id));
        }
        type = examTypeRepository.save(type);
        return toResponse(type);
    }

    public void delete(String id) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));

        if (examTypeRepository.existsByParentId(id)) {
            throw new ConflictException(
                    "Không thể xoá: loại kỳ thi này đang chứa các loại con. Hãy xoá/tách chúng trước.");
        }
        // Trước đây FK CASCADE xoá kèm toàn bộ phần thi/đề/bài làm; xoá mềm không cascade
        // nên chặn khi còn nội dung để không sót đề "mồ côi" vẫn hiện ra ngoài.
        long partCount = examPartRepository.countByExamTypeId(id);
        long testCount = testRepository.countByExamTypeId(id);
        if (partCount > 0 || testCount > 0) {
            throw new ConflictException(
                    "Không thể xoá: loại kỳ thi này còn " + partCount + " phần thi và " + testCount
                            + " đề thi. Hãy xoá chúng trước.");
        }
        examTypeRepository.delete(type);
    }

    private ExamTypeResponse toResponse(ExamType t) {
        ExamType parent = t.getParentId() == null
                ? null
                : examTypeRepository.findById(t.getParentId()).orElse(null);
        Long childCount = examTypeRepository.countByParentId(t.getExamTypeId());
        return examTypeMapper.toResponse(t, parent, childCount);
    }

    private static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");

    /** Trùng tên trang con cố định trên frontend thì URL của kỳ thi bị trang đó che mất: /exams/aws/collections/... */
    private static final Set<String> RESERVED_SLUGS = Set.of("collections");

    /** Slug do admin nhập: chữ thường, số, gạch ngang (vd "saa-c03"), không trùng kỳ thi khác. */
    private String validateSlug(String slug, String selfId) {
        if (slug == null || slug.isBlank()) {
            throw new BadRequestException("Slug không được để trống.");
        }
        if (slug.length() > 100 || !SLUG_PATTERN.matcher(slug).matches()) {
            throw new BadRequestException("Slug chỉ gồm chữ thường không dấu, số và gạch ngang, vd: saa-c03.");
        }
        if (RESERVED_SLUGS.contains(slug)) {
            throw new BadRequestException("Slug \"" + slug + "\" trùng đường dẫn hệ thống, hãy chọn slug khác.");
        }
        boolean taken = selfId == null
                ? examTypeRepository.existsBySlug(slug)
                : examTypeRepository.existsBySlugAndExamTypeIdNot(slug, selfId);
        if (taken) {
            throw new ConflictException("Slug đã được dùng: " + slug);
        }
        return slug;
    }

    private void validateScoreScale(ExamType type) {
        int min = type.getScoreMin();
        int max = type.getScoreMax();
        if (min < 0 || min >= max) {
            throw new BadRequestException("Thang điểm không hợp lệ: cần 0 ≤ điểm tối thiểu < điểm tối đa.");
        }
    }

    private String resolveParentId(String rawParentId, String selfId) {
        String parentId = rawParentId == null ? null : rawParentId.trim();
        if (parentId == null || parentId.isEmpty()) {
            return null;
        }
        if (parentId.equals(selfId)) {
            throw new BadRequestException("Loại kỳ thi không thể là cha của chính nó.");
        }
        ExamType parent = examTypeRepository.findById(parentId)
                .orElseThrow(() -> new BadRequestException("Loại kỳ thi cha không tồn tại."));
        if (parent.getParentId() != null) {
            throw new BadRequestException("Chỉ hỗ trợ 2 cấp: không thể chọn một loại con làm cha.");
        }
        if (selfId != null && examTypeRepository.existsByParentId(selfId)) {
            throw new BadRequestException(
                    "Loại kỳ thi này đang có loại con nên không thể trở thành con của loại khác.");
        }
        return parentId;
    }

}
