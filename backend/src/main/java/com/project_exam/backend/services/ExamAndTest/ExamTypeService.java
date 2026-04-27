package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.exception.NotFoundException;

import com.project_exam.backend.dto.request.ExamTypeRequest;
import com.project_exam.backend.dto.response.ExamTypeResponse;
import com.project_exam.backend.models.ExamType;
import com.project_exam.backend.repositories.ExamTypeRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ExamTypeService {

    private final ExamTypeRepository examTypeRepository;

    public List<ExamTypeResponse> findAll() {
        return examTypeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public ExamTypeResponse findById(String id) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        return toResponse(type);
    }

    public ExamTypeResponse create(ExamTypeRequest request) {
        ExamType type = new ExamType();
        type.setName(request.getName());
        type.setDescription(request.getDescription());
        type.setDurationMinutes(request.getDurationMinutes());
        type.setScoringMethod(request.getScoringMethod() != null ? request.getScoringMethod() : "DEFAULT");
        type = examTypeRepository.save(type);
        return toResponse(type);
    }

    public ExamTypeResponse update(String id, ExamTypeRequest request) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        if (request.getName() != null) type.setName(request.getName());
        if (request.getDescription() != null) type.setDescription(request.getDescription());
        if (request.getDurationMinutes() != null) type.setDurationMinutes(request.getDurationMinutes());
        if (request.getScoringMethod() != null) type.setScoringMethod(request.getScoringMethod());
        type = examTypeRepository.save(type);
        return toResponse(type);
    }

    public void delete(String id) {
        ExamType type = examTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));
        examTypeRepository.delete(type);
    }

    private ExamTypeResponse toResponse(ExamType t) {
        ExamTypeResponse res = new ExamTypeResponse();
        res.setExamTypeId(t.getExamTypeId());
        res.setName(t.getName());
        res.setDescription(t.getDescription());
        res.setDurationMinutes(t.getDurationMinutes());
        res.setScoringMethod(t.getScoringMethod());
        return res;
    }
}
