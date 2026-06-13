package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Skill;
import com.project_exam.backend.modules.assessment.exam.dto.SkillResponse;
import org.springframework.stereotype.Component;

@Component
public class SkillMapper {

    public SkillResponse toResponse(Skill skill) {
        return SkillResponse.builder()
                .skillId(skill.getSkillId())
                .name(skill.getName())
                .description(skill.getDescription())
                .build();
    }
}
