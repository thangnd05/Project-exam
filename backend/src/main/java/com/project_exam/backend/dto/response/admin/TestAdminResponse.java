package com.project_exam.backend.dto.response.admin;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class TestAdminResponse {

    private String testId;
    private String title;
    private String description;
    private String examTypeId;
    private String createdBy;
    private LocalDateTime createdAt;
    private String bannerUrl;
    private Integer durationMinutes;
    private LocalDateTime availableFrom;
    private LocalDateTime availableTo;
    private String status;
    private Integer maxAttempts;
    private Long totalAttempts;

    private String classId;

    private List<TestPartAdminResponse> parts;
}