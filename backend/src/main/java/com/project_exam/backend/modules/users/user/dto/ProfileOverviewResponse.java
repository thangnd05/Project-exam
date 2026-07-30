package com.project_exam.backend.modules.users.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class ProfileOverviewResponse {
    private String userId;
    private String userName;
    private String fullName;
    private String email;
    private String avatarUrl;
    private Boolean verified;
    private String roleId;
    private String roleName;
    private Instant createdAt;
    private TestStats testStats;
    private VocabularyStats vocabularyStats;
    private ClassStats classStats;

    @Getter
    @Builder
    public static class TestStats {
        private Long totalAttempts;
        private Long completedAttempts;
        private Long inProgressAttempts;
        private Integer bestScore;
        private Double averageScore;
        private Instant lastAttemptAt;
    }

    @Getter
    @Builder
    public static class VocabularyStats {
        private Long totalVocabulary;
        private Long learningVocabulary;
        private Long masteredVocabulary;
    }

    @Getter
    @Builder
    public static class ClassStats {
        private Long approvedClassCount;
        private Long pendingClassCount;
    }
}
