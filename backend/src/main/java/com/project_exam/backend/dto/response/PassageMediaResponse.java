package com.project_exam.backend.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PassageMediaResponse {

    private String id;

    private String passageId;

    private String mediaUrl;

    private String mediaType;
}
