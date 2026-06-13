package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassageMediaResponse {

    private String id;

    private String passageId;

    private String mediaUrl;

    private String mediaType;
}
