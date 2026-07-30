package com.project_exam.backend.modules.assessment.test.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class TestResponse {
    private String testId;
    private String title;
    private String description;
    private String examTypeId;
    private String examCategoryId;
    private String collectionId;
    private String createdBy;
    private Instant createdAt;
    private String bannerUrl;
    private Integer durationMinutes;
    private String classId;
    private String chapterId;
    private Instant availableFrom;
    private Instant availableTo;
    private String status;
    private Integer maxAttempts;
    private Integer attemptsUsed;
    private Integer remainingAttempts;
    private Long totalAttempts;
    private Boolean canDoTest;

    private Integer costCoins;
    private Boolean owned;
    private Boolean locked;

    private List<TestPartResponse> parts;

}

