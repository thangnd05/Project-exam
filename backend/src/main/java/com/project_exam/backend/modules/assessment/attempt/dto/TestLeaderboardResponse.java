package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.*;

import java.util.List;

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
        private int rank;
        private String userTestId;
        private Integer totalScore;
        private Long durationTaken;
    }
}
