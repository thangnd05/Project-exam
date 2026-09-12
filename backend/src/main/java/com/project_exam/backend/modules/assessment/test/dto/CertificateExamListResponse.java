package com.project_exam.backend.modules.assessment.test.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateExamListResponse {

    private List<TestResponse> tests;

    private String certificateTitle;
    private Integer passScore;
    private Integer validMonths;

    private boolean alreadyOwned;

    public static CertificateExamListResponse empty() {
        return CertificateExamListResponse.builder()
                .tests(List.of())
                .alreadyOwned(false)
                .build();
    }
}
