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

    /** true khi mock đã đạt target — không tạo plan mới. */
    private Boolean targetAchieved;

    private Integer targetScore;
    private Integer deadlineDays;

    /** Readiness từ bài chẩn đoán (mock/quick) — snapshot, không phải điểm quiz ải. */
    private Integer baselineReadiness;

    /** Level derived từ baselineReadiness ({@link com.project_exam.backend.modules.assessment.learning.support.ReadinessThresholds}). */
    private String readinessLevel;

    /** UserTest dùng làm nguồn baseline (có thể cập nhật sau refresh-diagnostic). */
    private String diagnosticUserTestId;

    /**
     * Code ExamCategory của bài chẩn đoán nguồn (QUICK_CHALLENGE / FULL_MOCK / ...).
     * Null nếu test nguồn không gắn category. FE dùng để nhắc "chẩn đoán từ Quick Challenge,
     * làm Full Mock để chính xác hơn".
     */
    private String diagnosisSourceCategory;

    /**
     * true khi bài chẩn đoán nguồn là bài LUYỆN TẬP THEO PART — chỉ phân tích các Part đã luyện,
     * nên lộ trình chỉ phủ những Part đó. FE nhắc làm bài thi thử đầy đủ để có lộ trình toàn diện.
     */
    private Boolean diagnosisSourcePractice;

    private String planStage;
    private String userTargetId;

    /** true khi plan ACTIVE sinh theo mục tiêu khác mục tiêu hiện tại (đã đổi/xoá target) — FE nhắc sinh lộ trình mới. */
    private Boolean targetOutdated;

    private Integer passAccuracyDefault;
    private Instant createdAt;

    /** Câu chốt motivation hiển thị đầu trang plan. */
    private String summary;

    private Integer totalTasks;
    private Integer passedTasks;
    private Integer estimatedDaysRemaining;

    private String recommendedTaskId;

    private List<PlanTaskDto> tasks;

    /** Ải nhóm theo Part — học từng Part riêng, không trộn. */
    private List<PlanPartGroupDto> partGroups;

    /** Part chưa đạt target nhưng không tạo được ải (thiếu tag trên câu). */
    private List<String> partsWithoutTasks;

    /** @deprecated Giữ tương thích; ưu tiên dùng partGroups / tasks. */
    private List<PlanPhaseDto> phases;
}
