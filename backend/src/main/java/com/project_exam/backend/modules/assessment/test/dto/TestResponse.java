package com.project_exam.backend.modules.assessment.test.dto;

import lombok.*;

import java.time.LocalDateTime;
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
    private String createdBy;
    private LocalDateTime createdAt;
    private String bannerUrl;
    private Integer durationMinutes;
    private String classId;
    private String chapterId;
    private LocalDateTime availableFrom;
    private LocalDateTime availableTo;
    private String status;
    private Integer maxAttempts;
    private Integer attemptsUsed;
    private Integer remainingAttempts;
    private Long totalAttempts;
    private Boolean canDoTest;
    private List<TestPartResponse> parts;

}

