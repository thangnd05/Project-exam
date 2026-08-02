package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.ExamCategory;
import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.ExamCategoryMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamCategoryRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamCategoryService {

    private final ExamCategoryRepository examCategoryRepository;
    private final ExamCategoryMapper examCategoryMapper;

    public List<ExamCategoryResponse> findAll() {
        return examCategoryRepository.findAll().stream()
                .sorted(Comparator
                        .comparing((ExamCategory c) -> c.getDisplayOrder() == null ? Integer.MAX_VALUE : c.getDisplayOrder())
                        .thenComparing(ExamCategory::getName, Comparator.nullsLast(String::compareTo)))
                .map(examCategoryMapper::toResponse)
                .toList();
    }

    public ExamCategoryResponse findById(String id) {
        ExamCategory category = examCategoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam category không tồn tại"));
        return examCategoryMapper.toResponse(category);
    }

    public ExamCategoryResponse findByCode(String code) {
        ExamCategory category = examCategoryRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Exam category không tồn tại: " + code));
        return examCategoryMapper.toResponse(category);
    }

    public ExamCategoryResponse create(ExamCategoryRequest request) {
        String code = normalizeCode(request.getCode());
        if (examCategoryRepository.existsByCode(code)) {
            throw new BadRequestException("Code đã tồn tại: " + code);
        }
        ExamCategory category = new ExamCategory();
        category.setCode(code);
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        applyOptionalFields(category, request);
        category = examCategoryRepository.save(category);
        return examCategoryMapper.toResponse(category);
    }

    public ExamCategoryResponse update(String id, ExamCategoryRequest request) {
        ExamCategory category = examCategoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam category không tồn tại"));

        if (request.getCode() != null) {
            String code = normalizeCode(request.getCode());
            if (!code.equals(category.getCode()) && examCategoryRepository.existsByCode(code)) {
                throw new BadRequestException("Code đã tồn tại: " + code);
            }
            category.setCode(code);
        }
        if (request.getName() != null) category.setName(request.getName());
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        applyOptionalFields(category, request);
        category = examCategoryRepository.save(category);
        return examCategoryMapper.toResponse(category);
    }

    public void delete(String id) {
        ExamCategory category = examCategoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam category không tồn tại"));
        examCategoryRepository.delete(category);
    }

    private void applyOptionalFields(ExamCategory category, ExamCategoryRequest request) {
        if (request.getGuestAllowed() != null) category.setGuestAllowed(request.getGuestAllowed());
        if (request.getDisplayOrder() != null) category.setDisplayOrder(request.getDisplayOrder());
    }

    private String normalizeCode(String raw) {
        return raw.trim().toUpperCase().replaceAll("\\s+", "_");
    }
}
