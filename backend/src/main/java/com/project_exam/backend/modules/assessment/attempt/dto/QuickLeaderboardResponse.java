package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class QuickLeaderboardResponse {
    private List<Entry> entries;
    private int totalParticipants;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Entry {
        private int rank;
        private String displayName;
        private String avatarUrl;
        private Integer totalScore;
        private Long durationTaken;
        private String examTypeName;
    }
}
