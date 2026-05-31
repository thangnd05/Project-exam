package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.*;

import java.util.List;

/**
 * Bảng xếp hạng của 1 đề.
 * - entries: danh sách đã xếp hạng (best attempt mỗi user, sort điểm desc rồi thời gian asc).
 * - me: hạng của chính người đang xem (lấy theo userId trong token). null nếu chưa có kết quả
 *       hoặc người xem là khách. Tách riêng để FE ghim 1 dòng "Hạng của bạn" kể cả khi
 *       user nằm ngoài top hiển thị (giống BXH game).
 * - totalParticipants: tổng số người đã có mặt trên bảng.
 */
@Getter
@AllArgsConstructor
@Builder
public class TestLeaderboardResponse {
    private List<UserTestResponse> entries;
    private MyRank me;
    private int totalParticipants;

    @Getter
    @AllArgsConstructor
    @Builder
    public static class MyRank {
        private int rank;              // 1-based
        private String userTestId;     // để FE highlight đúng dòng trong bảng
        private Integer totalScore;
        private Long durationTaken;    // giây
    }
}
