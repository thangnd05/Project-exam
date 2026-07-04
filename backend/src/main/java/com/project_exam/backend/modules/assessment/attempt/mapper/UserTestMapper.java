package com.project_exam.backend.modules.assessment.attempt.mapper;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@Component
public class UserTestMapper {

    /**
     * Map UserTest -> DTO. examTypeId và userName được service resolve (batch-load/lookup)
     * rồi truyền vào để tránh N+1; userName có thể null nếu không cần.
     */
    public UserTestResponse toResponse(UserTest userTest, String examTypeId, String userName) {
        return UserTestResponse.builder()
                .userTestId(userTest.getUserTestId())
                .userId(userTest.getUserId())
                .userName(userName)
                .testId(userTest.getTestId())
                .examTypeId(examTypeId)
                .startedAt(userTest.getStartedAt())
                .finishedAt(userTest.getFinishedAt())
                .totalScore(userTest.getTotalScore())
                .status(userTest.getStatus() != null ? userTest.getStatus().name() : null)
                .mode(userTest.getMode() != null ? userTest.getMode().name() : UserTest.Mode.FULL_TEST.name())
                .practicePartIds(parsePracticePartIds(userTest.getPracticePartIds()))
                .durationTaken(
                        userTest.getFinishedAt() != null && userTest.getStartedAt() != null
                                ? Duration.between(userTest.getStartedAt(), userTest.getFinishedAt()).getSeconds()
                                : null
                )
                .build();
    }

    /** CSV examPartId (chỉ có ở mode PRACTICE) -> List; null/blank -> null. */
    private List<String> parsePracticePartIds(String csv) {
        if (csv == null || csv.isBlank()) return null;
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
