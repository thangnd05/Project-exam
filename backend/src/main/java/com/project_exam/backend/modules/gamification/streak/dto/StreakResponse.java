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
}
