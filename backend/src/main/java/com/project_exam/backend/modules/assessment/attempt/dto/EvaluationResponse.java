package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class EvaluationResponse {

    private String id;
    private String content;
    private Integer rating;
    private LocalDateTime createdAt;

    private String userId;
    private String username;
    private String avatarUrl;
}
