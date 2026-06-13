package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.exam.dto.ExamPartRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ExamPartResponse;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.mapper.ExamPartMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamPartService {

    private final ExamPartRepository examPartRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ExamPartMapper examPartMapper;

    public List<ExamPartResponse> findAll() {
        return examPartRepository.findAllOrdered().stream()
                .map(examPartMapper::toResponse)
                .toList();
    }

    public List<ExamPartResponse> findByExamTypeId(String examTypeId) {
        return examPartRepository.findByExamTypeId(examTypeId).stream()
                .map(examPartMapper::toResponse)
                .toList();
    }

    public ExamPartResponse findById(String id) {
        ExamPart part = examPartRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam part không tồn tại"));
        return examPartMapper.toResponse(part);
    }

    public ExamPartResponse create(ExamPartRequest request) {
        String normalizedSkillId = normalizeSkillId(request.getSkillId());
        validateSkillRequirement(request.getExamTypeId(), normalizedSkillId);

        ExamPart part = new ExamPart();
        part.setExamTypeId(request.getExamTypeId());
        part.setName(request.getName());
        part.setDescription(request.getDescription());
        part.setDefaultNumQuestions(request.getDefaultNumQuestions());
        part.setSkillId(normalizedSkillId);
        if (request.getDisplayOrder() != null) part.setDisplayOrder(request.getDisplayOrder());
        part = examPartRepository.save(part);
        return examPartMapper.toResponse(part);
    }

    public ExamPartResponse update(String id, ExamPartRequest request) {
        ExamPart part = examPartRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam part không tồn tại"));

        String nextExamTypeId = request.getExamTypeId() != null ? request.getExamTypeId() : part.getExamTypeId();
        String nextSkillId = request.getSkillId() != null
                ? normalizeSkillId(request.getSkillId())
                : part.getSkillId();
        validateSkillRequirement(nextExamTypeId, nextSkillId);

        if (request.getExamTypeId() != null) part.setExamTypeId(nextExamTypeId);
        if (request.getName() != null) part.setName(request.getName());
        if (request.getDescription() != null) part.setDescription(request.getDescription());
        if (request.getDefaultNumQuestions() != null) part.setDefaultNumQuestions(request.getDefaultNumQuestions());
        if (request.getSkillId() != null) part.setSkillId(nextSkillId);
        if (request.getDisplayOrder() != null) part.setDisplayOrder(request.getDisplayOrder());
        part = examPartRepository.save(part);
        return examPartMapper.toResponse(part);
    }

    public void delete(String id) {
        ExamPart part = examPartRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exam part không tồn tại"));
        examPartRepository.delete(part);
    }

    private String normalizeSkillId(String skillId) {
        if (skillId == null) {
            return null;
        }
        String trimmedSkillId = skillId.trim();
        return trimmedSkillId.isEmpty() ? null : trimmedSkillId;
    }

    private void validateSkillRequirement(String examTypeId, String skillId) {
        if (examTypeId == null || examTypeId.isBlank()) {
            return;
        }

        ExamType examType = examTypeRepository.findById(examTypeId)
                .orElseThrow(() -> new NotFoundException("Exam type không tồn tại"));

        String scoringMethod = examType.getScoringMethod();
        if ("TOEIC_SCALE".equalsIgnoreCase(scoringMethod) && skillId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "skillId là bắt buộc với exam type dùng TOEIC_SCALE"
            );
        }
    }
}
