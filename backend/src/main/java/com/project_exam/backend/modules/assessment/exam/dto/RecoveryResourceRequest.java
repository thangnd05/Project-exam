package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryResourceRequest {
    private String title;
    private String description;
    private RecoveryResource.ResourceType resourceType;
    private String url; // dùng khi resourceType = LINK, hoặc khi không upload file
    private List<String> tagIds;
}
