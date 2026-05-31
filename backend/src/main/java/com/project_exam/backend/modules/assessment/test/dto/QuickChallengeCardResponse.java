package com.project_exam.backend.modules.assessment.test.dto;

import lombok.*;

import java.util.List;

/**
 * Card hiển thị ở Hero landing page: 1 bài Quick Challenge + danh sách part của nó.
 * Cố tình KHÔNG kèm % / điểm số (user chưa làm bài) — chỉ tên part + số câu để preview.
 */
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
    private String examTypeName;    // tên nhóm (AWS Cloud / TOEIC...) -> để FE dựng tab phân loại
    private String status;          // OPEN / NOT_STARTED (ENDED đã bị lọc bỏ)
    private int totalQuestions;     // tổng số câu của cả bài
    private List<PartSummary> parts;

    @Getter
    @AllArgsConstructor
    @Builder
    public static class PartSummary {
        private String name;        // tên part (ExamPart.name)
        private int numQuestions;   // số câu của part trong bài này (TestPart.numQuestions)
        private int displayOrder;   // dùng để sort phía BE; FE có thể bỏ qua
    }
}
