package com.project_exam.backend.modules.assessment.target.dto;

import lombok.Data;

@Data
public class UserTargetPartResponse {
    private String examPartId;
    /** Aim — ngưỡng % cần đạt. */
    private Integer requiredPercentage;
    /** % từ mock gần nhất. */
    private java.math.BigDecimal currentScore;
    private String lastUserTestId;
}
