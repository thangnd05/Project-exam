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

    // Optional: phân loại bài thi (Quick Challenge / Full Mock / Recovery / Mini Quiz...).
    // Có thể null — khi đó test mặc định là legacy/standard.
    private String examCategoryId;

    // Hỗ trợ cấu hình thời gian mở/đóng đề
    private LocalDateTime availableFrom;
    private LocalDateTime availableTo;

    // Giá xu để mở khoá bài. Chỉ admin set được; user thường / bài lớp sẽ bị ép null.
    private Integer costCoins;
}