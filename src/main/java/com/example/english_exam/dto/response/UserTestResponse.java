package com.example.english_exam.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTestResponse {
    private Long userTestId;
    private Long userId;     // 🟢 thêm
    private String userName;
    private Long testId;     // 🟢 thêm
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Integer totalScore;
    private String status;
    private Long durationTaken; // Thời gian làm bài (giây) = finishedAt - startedAt
}
