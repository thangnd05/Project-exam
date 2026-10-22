package com.project_exam.backend.modules.assessment.test.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Cặp định danh của đề: testId cho API, slug cho URL. */
@Getter
@AllArgsConstructor
public class TestRefResponse {
    private String testId;
    private String slug;
}
