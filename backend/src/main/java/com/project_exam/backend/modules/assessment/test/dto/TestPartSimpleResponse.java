package com.project_exam.backend.modules.assessment.test.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestPartSimpleResponse {
    private String testPartId;
    private String testId;
    private String examPartId;
    private Integer numQuestions;
}
