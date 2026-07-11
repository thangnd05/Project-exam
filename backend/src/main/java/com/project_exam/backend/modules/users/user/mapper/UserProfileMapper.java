package com.project_exam.backend.modules.users.user.mapper;

import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.user.dto.ProfileOverviewResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Mapper thuần cho ProfileOverviewResponse. Toàn bộ số liệu thống kê
 * (test/vocabulary/class) đều được tính ở service (truy nhiều repository),
 * rồi truyền vào đây qua tham số — mapper không giữ repository/logic.
 */
@Component
public class UserProfileMapper {

    public ProfileOverviewResponse toProfileOverview(
            User user,
            String roleName,
            // test stats
            long totalAttempts,
            long completedAttempts,
            long inProgressAttempts,
            Integer bestScore,
            Double averageScore,
            LocalDateTime lastAttemptAt,
            // vocabulary stats
            long totalVocabulary,
            long learningVocabulary,
            long masteredVocabulary,
            // class stats
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
