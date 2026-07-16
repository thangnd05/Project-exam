package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryResourceRequest {
    private String title;
    private String description;
    private String url;
    private List<String> tagIds;
    private String examPartId; 
}
