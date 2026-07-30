package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationResponse {

    private String id;
    private String content;
    private Integer rating;
    private Instant createdAt;

    private String userId;
    private String username;
    private String avatarUrl;
}
