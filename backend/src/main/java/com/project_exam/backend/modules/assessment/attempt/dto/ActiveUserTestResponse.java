package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveUserTestResponse {
    private String serverNow;
    private String userTestId;
    private String status;
    private String startedAt;

    public static ActiveUserTestResponse none(String serverNow) {
        return ActiveUserTestResponse.builder()
                .serverNow(serverNow)
                .userTestId(null)
                .status("NONE")
                .startedAt(null)
                .build();
    }
}
