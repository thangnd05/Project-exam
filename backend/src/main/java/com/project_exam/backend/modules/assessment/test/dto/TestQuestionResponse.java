package com.project_exam.backend.modules.assessment.test.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestQuestionResponse {
    private String testQuestionId;
    private String testPartId;
    private String questionId;
    private Integer displayOrder;
}
