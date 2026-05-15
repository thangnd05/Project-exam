package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TagRequest {
    private String name;
    private String examTypeId;
    private String parentId; // nullable
}
