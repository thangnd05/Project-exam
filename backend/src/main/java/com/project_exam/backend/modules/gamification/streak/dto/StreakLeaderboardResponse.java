package com.project_exam.backend.modules.gamification.streak.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class StreakLeaderboardResponse {
    private List<Entry> entries;
    private int totalParticipants;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Entry {
        private int rank;
        private String displayName;
        private String userName;
        private String avatarUrl;
        private int longestStreak;
    }
}
