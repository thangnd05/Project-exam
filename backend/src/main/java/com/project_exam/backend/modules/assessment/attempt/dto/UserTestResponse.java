package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.*;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTestResponse {
    private String userTestId;
    private String userId;
    private String userName;
    private String testId;
    private String testTitle;
    private String examTypeId;
    private Instant startedAt;
    private Instant finishedAt;
    private Integer totalScore;
    private String status;
    private String mode;
    private List<String> practicePartIds;
    private Long durationTaken;
}
