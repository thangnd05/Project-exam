package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTestResponse {
    private String userTestId;
    private String userId;     // thêm
    private String userName;
    private String testId;     // thêm
    private String testTitle;  // thêm — tên bài kiểm tra để FE hiển thị (vd dropdown chọn bài)
    private String examTypeId; // thêm — để FE lọc mock theo kỳ thi
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Integer totalScore;
    private String status;
    private String mode; // FULL_TEST | PRACTICE (null dữ liệu cũ = FULL_TEST)
    private List<String> practicePartIds; // examPartId các Part đã luyện, chỉ có khi mode = PRACTICE
    private Long durationTaken; // Thời gian làm bài (giây) = finishedAt - startedAt
}
