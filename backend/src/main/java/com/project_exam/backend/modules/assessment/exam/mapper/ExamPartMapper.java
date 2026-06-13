package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.dto.ExamPartResponse;
import org.springframework.stereotype.Component;

@Component
public class ExamPartMapper {

    public ExamPartResponse toResponse(ExamPart p) {
        return ExamPartResponse.builder()
                .examPartId(p.getExamPartId())
                .examTypeId(p.getExamTypeId())
                .name(p.getName())
                .description(p.getDescription())
                .defaultNumQuestions(p.getDefaultNumQuestions())
                .skillId(p.getSkillId())
                .displayOrder(p.getDisplayOrder())
                .build();
    }
}
