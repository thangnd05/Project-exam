package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;

import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.mapper.ExamTypeMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamTypeService {

    private final ExamTypeRepository examTypeRepository;
    private final ExamTypeMapper examTypeMapper;
    private final AuthUtils authUtils;

    public List<ExamTypeResponse> findAll() {
        return examTypeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ExamTypeResponse> findStandard() {
        return examTypeRepository.findStandard().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ExamTypeResponse> findFlexible() {
        return examTypeRepository.findFlexible().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ExamTypeResponse> findChildren(String parentId) {
        return examTypeRepository.findByParentId(parentId).stream()
                .map(this::toResponse)
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    public ExamTypeResponse findById(String id) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        return toResponse(type);
    }

    public ExamTypeResponse create(ExamTypeRequest request) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_MANAGE);
        ExamType type = new ExamType();
        type.setName(request.getName());
        type.setDescription(request.getDescription());
        type.setImageUrl(request.getImageUrl());
        type.setDurationMinutes(request.getDurationMinutes());
        type.setScoringMethod(request.getScoringMethod() != null ? request.getScoringMethod() : "DEFAULT");
        type.setFlexible(Boolean.TRUE.equals(request.getFlexible()));
        type.setParentId(resolveParentId(request.getParentId(), null));
        type = examTypeRepository.save(type);
        return toResponse(type);
    }

    public ExamTypeResponse update(String id, ExamTypeRequest request) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_MANAGE);
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        if (request.getName() != null) type.setName(request.getName());
        if (request.getDescription() != null) type.setDescription(request.getDescription());
        if (request.getImageUrl() != null) type.setImageUrl(request.getImageUrl());
        if (request.getDurationMinutes() != null) type.setDurationMinutes(request.getDurationMinutes());
        if (request.getScoringMethod() != null) type.setScoringMethod(request.getScoringMethod());
        if (request.getFlexible() != null) type.setFlexible(request.getFlexible());

        if (request.getParentId() != null) {
            type.setParentId(resolveParentId(request.getParentId(), id));
        }
        type = examTypeRepository.save(type);
        return toResponse(type);
    }

    public void delete(String id) {
        authUtils.requirePermission(PermissionCatalog.EXAM_TYPE_MANAGE);
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));

        if (examTypeRepository.existsByParentId(id)) {
            throw new ConflictException(
                    "Không thể xoá: loại kỳ thi này đang chứa các loại con. Hãy xoá/tách chúng trước.");
        }
        examTypeRepository.delete(type);
    }

    private ExamTypeResponse toResponse(ExamType t) {
        String parentName = null;
        if (t.getParentId() != null) {
            parentName = examTypeRepository.findById(t.getParentId())
                    .map(ExamType::getName)
                    .orElse(null);
        }
        Long childCount = examTypeRepository.countByParentId(t.getExamTypeId());
        return examTypeMapper.toResponse(t, parentName, childCount);
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
