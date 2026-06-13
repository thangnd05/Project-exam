package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.ScoringConversion;
import com.project_exam.backend.modules.assessment.exam.dto.ScoringConversionResponse;
import org.springframework.stereotype.Component;

@Component
public class ScoringConversionMapper {

    public ScoringConversionResponse toResponse(ScoringConversion c) {
        return ScoringConversionResponse.builder()
                .conversionId(c.getConversionId())
                .examTypeId(c.getExamTypeId())
                .skillId(c.getSkillId())
                .numCorrect(c.getNumCorrect())
                .convertedScore(c.getConvertedScore())
                .build();
    }
}
