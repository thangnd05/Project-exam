package com.project_exam.backend.modules.assessment.test.dto;

import lombok.*;

import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class QuickChallengeCardResponse {
    private String testId;
    private String title;
    private String description;
    private Integer durationMinutes;
    private String bannerUrl;
    private String examTypeId;
    private String examTypeName;
    private String examTypeImageUrl;
    private String status;
    private int totalQuestions;
    private List<PartSummary> parts;

    @Getter
    @AllArgsConstructor
    @Builder
    public static class PartSummary {
        private String name;
        private int numQuestions;
        private int displayOrder;
    }
}
