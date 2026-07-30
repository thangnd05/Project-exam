package com.project_exam.backend.modules.assessment.test.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestPartSummaryResponse {
    private String testPartId;
    private String examPartId;
    private String partName;
    private String skillName;
    private Integer questionCount;
    private Integer displayOrder;
}
