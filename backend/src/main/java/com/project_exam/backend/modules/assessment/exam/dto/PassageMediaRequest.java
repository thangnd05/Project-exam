package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PassageMediaRequest {

    private String passageId;

    private String mediaUrl;

    private String mediaType;
}
