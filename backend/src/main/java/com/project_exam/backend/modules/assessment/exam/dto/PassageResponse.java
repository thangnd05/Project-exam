package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Passage;
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
