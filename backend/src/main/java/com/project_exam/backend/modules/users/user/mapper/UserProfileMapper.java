package com.project_exam.backend.modules.users.user.mapper;

import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.user.dto.ProfileOverviewResponse;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class UserProfileMapper {

    public ProfileOverviewResponse toProfileOverview(
            User user,
            String roleName,

            long totalAttempts,
            long completedAttempts,
            long inProgressAttempts,
            Integer bestScore,
            Double averageScore,
            Instant lastAttemptAt,

            long totalVocabulary,
            long learningVocabulary,
            long masteredVocabulary,

            long approvedClassCount,
            long pendingClassCount
    ) {
        return ProfileOverviewResponse.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .verified(user.getVerified())
                .roleId(user.getRoleId())
                .roleName(roleName)
                .createdAt(user.getCreatedAt())
                .testStats(ProfileOverviewResponse.TestStats.builder()
                        .totalAttempts(totalAttempts)
                        .completedAttempts(completedAttempts)
                        .inProgressAttempts(inProgressAttempts)
                        .bestScore(bestScore)
                        .averageScore(averageScore)
                        .lastAttemptAt(lastAttemptAt)
                        .build())
                .vocabularyStats(ProfileOverviewResponse.VocabularyStats.builder()
                        .totalVocabulary(totalVocabulary)
                        .learningVocabulary(learningVocabulary)
                        .masteredVocabulary(masteredVocabulary)
                        .build())
                .classStats(ProfileOverviewResponse.ClassStats.builder()
                        .approvedClassCount(approvedClassCount)
                        .pendingClassCount(pendingClassCount)
                        .build())
                .build();
    }
}
