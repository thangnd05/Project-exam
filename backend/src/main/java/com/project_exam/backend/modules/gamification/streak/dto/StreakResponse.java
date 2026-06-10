package com.project_exam.backend.modules.gamification.streak.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class StreakResponse {
    private Integer currentStreak;
    private Integer longestStreak;
    private LocalDate lastActivityDate;
    private Boolean increased; // true nếu lần recordActivity vừa rồi làm streak tăng

    private Integer lostStreak;  // số ngày chuỗi vừa đứt còn khôi phục được (0 nếu không có)
    private Boolean canRecover;  // còn khôi phục được không (đứt, chưa học lại, tính năng đang bật)
    private Integer recoverCost; // giá xu để khôi phục
}
