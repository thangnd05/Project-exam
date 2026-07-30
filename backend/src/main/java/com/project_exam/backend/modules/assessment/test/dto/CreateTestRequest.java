package com.project_exam.backend.modules.assessment.test.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class CreateTestRequest {
    private String title;
    private String description;
    private String examTypeId;
    private Integer durationMinutes;
    private String bannerUrl;
    private Integer maxAttempts;
    private String classId;
    private String chapterId;

    private String examCategoryId;

    private String collectionId;

    private Instant availableFrom;
    private Instant availableTo;

    private Integer costCoins;
}
