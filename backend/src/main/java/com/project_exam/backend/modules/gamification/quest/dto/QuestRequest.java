package com.project_exam.backend.modules.gamification.quest.dto;

import com.project_exam.backend.modules.gamification.quest.domain.QuestConditionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.time.LocalDateTime;

/** Tạo/cập nhật nhiệm vụ (admin). */
@Data
public class QuestRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Số xu thưởng không được để trống")
    @PositiveOrZero(message = "Số xu thưởng không được âm")
    private Integer rewardCoins;

    @NotNull(message = "Loại điều kiện không được để trống")
    private QuestConditionType conditionType;

    @PositiveOrZero(message = "Mục tiêu không được âm")
    private Integer conditionTarget;

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private Boolean active;
}
