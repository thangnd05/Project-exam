package com.project_exam.backend.modules.assessment.test.dto;

import lombok.*;
import java.time.Instant;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class TestAdminResponse {

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
    private Instant availableFrom;
    private Instant availableTo;
    private String status;
    private Integer maxAttempts;
    private Long totalAttempts;

    private String classId;

    private List<TestPartAdminResponse> parts;
}