package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class PassageMapper {

    public PassageResponse toResponse(Passage passage) {
        return toResponse(passage, Collections.emptyList());
    }

    public PassageResponse toResponse(Passage passage, List<PassageMediaResponse> passageMedias) {
        return PassageResponse.builder()
                .passageId(passage.getPassageId())
                .content(passage.getContent())
                .contentTranslation(passage.getContentTranslation())
                .mediaUrl(passage.getMediaUrl())
                .passageType(passage.getPassageType())
                .passageMedias(passageMedias == null ? Collections.emptyList() : passageMedias)
                .build();
    }
}
