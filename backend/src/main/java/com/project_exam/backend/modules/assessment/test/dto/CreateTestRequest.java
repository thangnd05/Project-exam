package com.project_exam.backend.modules.assessment.test.dto;

import lombok.Data;
import java.time.LocalDateTime;

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

    // Hỗ trợ cấu hình thời gian mở/đóng đề
    private LocalDateTime availableFrom;
    private LocalDateTime availableTo;
}