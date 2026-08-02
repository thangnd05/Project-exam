package com.project_exam.backend.modules.assessment.learning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GeneratePlanRequest {

    @NotBlank(message = "userTestId không được để trống")
    private String userTestId;

    /** Optional — FE hiện có thể chưa gửi; dùng để cap estimatedDaysRemaining. */
    @Min(value = 3, message = "Cần tối thiểu 3 ngày")
    @Max(value = 365, message = "Tối đa 365 ngày")
    private Integer deadlineDays;

    /** Optional — override mục tiêu điểm; null thì lấy từ UserTarget hiện tại. */
    private Integer targetScore;

    /** Optional — giới hạn sinh ải theo một số Part; null/empty = toàn bộ Part cần cải thiện. */
    private java.util.List<String> focusExamPartIds;
}
