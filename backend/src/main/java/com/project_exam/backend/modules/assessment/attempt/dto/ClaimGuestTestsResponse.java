package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimGuestTestsResponse {
    private int claimed;
}
