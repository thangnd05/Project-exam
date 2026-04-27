package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.exception.NotFoundException;

import com.project_exam.backend.dto.request.ScoringConversionRequest;
import com.project_exam.backend.dto.response.ScoringConversionResponse;
import com.project_exam.backend.models.ScoringConversion;
import com.project_exam.backend.repositories.ScoringConversionRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ScoringConversionService {

    private final ScoringConversionRepository scoringConversionRepository;

    public List<ScoringConversionResponse> findAll() {
        return scoringConversionRepository.findAll().stream()
                .map(this::toResponse)
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
                .map(this::toResponse)
                .toList();
    }

    public ScoringConversionResponse findById(String id) {
        ScoringConversion c = scoringConversionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Scoring conversion không tồn tại"));
        return toResponse(c);
    }

    public ScoringConversionResponse create(ScoringConversionRequest request) {
        ScoringConversion c = new ScoringConversion();
        c.setExamTypeId(request.getExamTypeId());
        c.setSkillId(request.getSkillId());
        c.setNumCorrect(request.getNumCorrect());
        c.setConvertedScore(request.getConvertedScore());
        c = scoringConversionRepository.save(c);
        return toResponse(c);
    }

    public ScoringConversionResponse update(String id, ScoringConversionRequest request) {
        ScoringConversion c = scoringConversionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Scoring conversion không tồn tại"));
        if (request.getExamTypeId() != null) c.setExamTypeId(request.getExamTypeId());
        if (request.getSkillId() != null) c.setSkillId(request.getSkillId());
        if (request.getNumCorrect() != null) c.setNumCorrect(request.getNumCorrect());
        if (request.getConvertedScore() != null) c.setConvertedScore(request.getConvertedScore());
        c = scoringConversionRepository.save(c);
        return toResponse(c);
    }

    public void delete(String id) {
        ScoringConversion c = scoringConversionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Scoring conversion không tồn tại"));
        scoringConversionRepository.delete(c);
    }

    private ScoringConversionResponse toResponse(ScoringConversion c) {
        ScoringConversionResponse res = new ScoringConversionResponse();
        res.setConversionId(c.getConversionId());
        res.setExamTypeId(c.getExamTypeId());
        res.setSkillId(c.getSkillId());
        res.setNumCorrect(c.getNumCorrect());
        res.setConvertedScore(c.getConvertedScore());
        return res;
    }
}
