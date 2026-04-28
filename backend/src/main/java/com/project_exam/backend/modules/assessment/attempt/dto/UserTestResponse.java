package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTestResponse {
    private String userTestId;
    private String userId;     // 🟢 thêm
    private String userName;
    private String testId;     // 🟢 thêm
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Integer totalScore;
    private String status;
    private Long durationTaken; // Thời gian làm bài (giây) = finishedAt - startedAt
}
