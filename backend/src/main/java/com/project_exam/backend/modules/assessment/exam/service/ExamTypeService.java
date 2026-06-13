package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.mapper.ExamTypeMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ExamTypeService {

    private final ExamTypeRepository examTypeRepository;
    private final ExamTypeMapper examTypeMapper;

    public List<ExamTypeResponse> findAll() {
        return examTypeRepository.findAll().stream()
                .map(examTypeMapper::toResponse)
                .toList();
    }

    public ExamTypeResponse findById(String id) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        return examTypeMapper.toResponse(type);
    }

    public ExamTypeResponse create(ExamTypeRequest request) {
        ExamType type = new ExamType();
        type.setName(request.getName());
        type.setDescription(request.getDescription());
        type.setDurationMinutes(request.getDurationMinutes());
        type.setScoringMethod(request.getScoringMethod() != null ? request.getScoringMethod() : "DEFAULT");
        type = examTypeRepository.save(type);
        return examTypeMapper.toResponse(type);
    }

    public ExamTypeResponse update(String id, ExamTypeRequest request) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        if (request.getName() != null) type.setName(request.getName());
        if (request.getDescription() != null) type.setDescription(request.getDescription());
        if (request.getDurationMinutes() != null) type.setDurationMinutes(request.getDurationMinutes());
        if (request.getScoringMethod() != null) type.setScoringMethod(request.getScoringMethod());
        type = examTypeRepository.save(type);
        return examTypeMapper.toResponse(type);
    }

    public void delete(String id) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        examTypeRepository.delete(type);
    }

}
