package com.project_exam.backend.modules.assessment.test.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CanStartTestResponse {
    private boolean canStart;
    private String message;
    private Integer costCoins;
    private Boolean owned;
    private Boolean requiresPayment;
}
