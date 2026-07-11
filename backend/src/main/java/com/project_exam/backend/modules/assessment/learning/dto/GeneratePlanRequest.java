package com.project_exam.backend.modules.assessment.learning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GeneratePlanRequest {

    /** UserTest đã hoàn thành để chẩn đoán điểm yếu (quick test hoặc full mock). */
    @NotBlank(message = "userTestId không được để trống")
    private String userTestId;

    /** Số ngày ước lượng đến ngày thi (optional, chỉ hiển thị gợi ý). */
    @Min(value = 3, message = "Cần tối thiểu 3 ngày")
    @Max(value = 365, message = "Tối đa 365 ngày")
    private Integer deadlineDays;

    /** Mục tiêu điểm. Optional, nếu null sẽ dùng UserTarget đã set. */
    private Integer targetScore;

    /**
     * Part muốn đưa vào lộ trình (examPartId). Rỗng/null = tất cả Part chưa đạt target trên bài chẩn đoán.
     */
    private java.util.List<String> focusExamPartIds;
}
