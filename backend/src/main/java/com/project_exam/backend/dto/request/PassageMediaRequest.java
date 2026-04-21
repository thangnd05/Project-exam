package com.project_exam.backend.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PassageMediaRequest {

    private String passageId;

    private String mediaUrl;

    private String mediaType; // IMAGE / AUDIO
}
