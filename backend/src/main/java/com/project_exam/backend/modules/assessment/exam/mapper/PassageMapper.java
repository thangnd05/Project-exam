package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import org.springframework.stereotype.Component;

@Component
public class PassageMapper {

    public PassageResponse toResponse(Passage passage) {
        return PassageResponse.builder()
                .passageId(passage.getPassageId())
                .content(passage.getContent())
                .contentTranslation(passage.getContentTranslation())
                .mediaUrl(passage.getMediaUrl())
                .passageType(passage.getPassageType())
                .build();
    }
}
