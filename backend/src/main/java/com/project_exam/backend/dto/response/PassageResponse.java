package com.project_exam.backend.dto.response;

import com.project_exam.backend.models.Passage;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PassageResponse {
    private String passageId;
    private String content;
    private String mediaUrl;
    private Passage.PassageType passageType;
}
