package com.project_exam.backend.modules.assessment.exam.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.PassageMedia;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import org.springframework.stereotype.Component;

@Component
public class PassageMediaMapper {

    public PassageMediaResponse toResponse(PassageMedia media) {
        return PassageMediaResponse.builder()
                .id(media.getId())
                .passageId(media.getPassageId())
                .mediaUrl(media.getMediaUrl())
                .mediaType(media.getMediaType().name())
                .build();
    }
}
