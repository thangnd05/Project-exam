package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
public class PlanResponse {

    private String learningPlanId;
    private String userId;
    private String examTypeId;
    private String sourceUserTestId;

    private Integer planSequence;
    private String status;
    private String replacedByPlanId;

    private Boolean targetAchieved;

    private Integer targetScore;

    private Integer baselineReadiness;

    private String readinessLevel;

    private String diagnosisSourceCategory;

    private Boolean diagnosisSourcePractice;

    private String planStage;
    private String userTargetId;

    private Boolean targetOutdated;

    private Instant createdAt;

    private Integer totalTasks;
    private Integer passedTasks;

    private String recommendedTaskId;

    /**
     * Chỉ có khi cập nhật theo mục tiêu mới (resync): số ải đang "đã vượt" phải làm lại vì
     * ngưỡng mới cao hơn thành tích cũ. Thay đổi khác (thêm/bớt ải) user nhìn thấy ngay trên
     * danh sách nên không cần báo.
     */
    private Integer reopenedTasks;

    private List<PlanPartGroupResponse> partGroups;

    private List<String> partsWithoutTasks;
}
