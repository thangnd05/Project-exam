package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.exception.BadRequestException;

import com.project_exam.backend.modules.assessment.exam.dto.ScoringConversionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.ScoringConversionResponse;
import com.project_exam.backend.modules.assessment.exam.domain.ScoringConversion;
import com.project_exam.backend.modules.assessment.exam.mapper.ScoringConversionMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ScoringConversionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoringConversionService {

    private final ScoringConversionRepository scoringConversionRepository;
    private final ScoringConversionMapper scoringConversionMapper;

    public List<ScoringConversionResponse> findAll() {
        return scoringConversionRepository.findAll().stream()
                .map(scoringConversionMapper::toResponse)
                .toList();
    }

    public List<ScoringConversionResponse> findByFilters(String examTypeId, String skillId) {
        List<ScoringConversion> conversions;
        if (examTypeId != null && !examTypeId.isBlank() && skillId != null && !skillId.isBlank()) {
            conversions = scoringConversionRepository.findByExamTypeIdAndSkillId(examTypeId, skillId);
        } else if (skillId != null && !skillId.isBlank()) {
            conversions = scoringConversionRepository.findBySkillId(skillId);
        } else if (examTypeId != null && !examTypeId.isBlank()) {
            conversions = scoringConversionRepository.findByExamTypeId(examTypeId);
        } else {
            conversions = scoringConversionRepository.findAll();
        }

        return conversions.stream()
                .map(scoringConversionMapper::toResponse)
                .toList();
    }

    public ScoringConversionResponse findById(String id) {
        ScoringConversion c = scoringConversionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Scoring conversion không tồn tại"));
        return scoringConversionMapper.toResponse(c);
    }

    public ScoringConversionResponse create(ScoringConversionRequest request) {
        validateRequest(request);
        ScoringConversion c = new ScoringConversion();
        c.setExamTypeId(request.getExamTypeId().trim());
        c.setSkillId(request.getSkillId().trim());
        c.setNumCorrect(request.getNumCorrect());
        c.setConvertedScore(request.getConvertedScore());
        c = scoringConversionRepository.save(c);
        return scoringConversionMapper.toResponse(c);
    }

    public List<ScoringConversionResponse> createBulk(List<ScoringConversionRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("Danh sách quy đổi không được để trống");
        }

        List<ScoringConversion> conversions = new ArrayList<>();
        for (ScoringConversionRequest request : requests) {
            validateRequest(request);
            ScoringConversion conversion = new ScoringConversion();
            conversion.setExamTypeId(request.getExamTypeId().trim());
            conversion.setSkillId(request.getSkillId().trim());
            conversion.setNumCorrect(request.getNumCorrect());
            conversion.setConvertedScore(request.getConvertedScore());
            conversions.add(conversion);
        }

        return scoringConversionRepository.saveAll(conversions).stream()
                .map(scoringConversionMapper::toResponse)
                .toList();
    }

    public ScoringConversionResponse update(String id, ScoringConversionRequest request) {
        ScoringConversion c = scoringConversionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Scoring conversion không tồn tại"));
        if (request.getExamTypeId() != null) c.setExamTypeId(request.getExamTypeId());
        if (request.getSkillId() != null) c.setSkillId(request.getSkillId());
        if (request.getNumCorrect() != null) c.setNumCorrect(request.getNumCorrect());
        if (request.getConvertedScore() != null) c.setConvertedScore(request.getConvertedScore());
        c = scoringConversionRepository.save(c);
        return scoringConversionMapper.toResponse(c);
    }

    public void delete(String id) {
        ScoringConversion c = scoringConversionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Scoring conversion không tồn tại"));
        scoringConversionRepository.delete(c);
    }

    private void validateRequest(ScoringConversionRequest request) {
        if (request == null) {
            throw new BadRequestException("Payload quy đổi không hợp lệ");
        }
        if (request.getExamTypeId() == null || request.getExamTypeId().trim().isEmpty()) {
            throw new BadRequestException("examTypeId là bắt buộc");
        }
        if (request.getSkillId() == null || request.getSkillId().trim().isEmpty()) {
            throw new BadRequestException("skillId là bắt buộc");
        }
        if (request.getNumCorrect() == null || request.getNumCorrect() < 0) {
            throw new BadRequestException("numCorrect phải lớn hơn hoặc bằng 0");
        }
        if (request.getConvertedScore() == null || request.getConvertedScore() < 0) {
            throw new BadRequestException("convertedScore phải lớn hơn hoặc bằng 0");
        }
    }
}
