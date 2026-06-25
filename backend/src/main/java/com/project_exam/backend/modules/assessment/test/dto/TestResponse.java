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
    private String collectionId;
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

    // Bài trả phí bằng xu: costCoins>0 = cần mua; owned = đã mở khoá; locked = trả phí & chưa mua.
    private Integer costCoins;
    private Boolean owned;
    private Boolean locked;

    private List<TestPartResponse> parts;

}

