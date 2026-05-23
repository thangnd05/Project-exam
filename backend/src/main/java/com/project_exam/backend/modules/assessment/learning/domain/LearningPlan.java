package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "learning_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String learningPlanId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "exam_type_id", nullable = false)
    private String examTypeId;

    /** UserTest gốc dùng để chẩn đoán điểm yếu khi sinh plan này. */
    @Column(name = "source_user_test_id", nullable = false)
    private String sourceUserTestId;

    /** Mục tiêu điểm (copy từ UserTarget tại thời điểm tạo). Null nếu user chưa set. */
    @Column(name = "target_score")
    private Integer targetScore;

    /** Liên kết mục tiêu cá nhân (ngưỡng % theo Part). */
    @Column(name = "user_target_id")
    private String userTargetId;

    /** Số ngày ước lượng đến ngày thi (không ép tiến độ). */
    @Column(name = "deadline_days")
    private Integer deadlineDays;

    /**
     * Readiness snapshot từ bài chẩn đoán ({@link #sourceUserTestId}).
     * Không cập nhật khi nộp phiên học ải; có thể refresh qua API hoặc sync khi getPlan.
     */
    @Column(name = "baseline_readiness")
    private Integer baselineReadiness;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_stage", length = 20, nullable = false)
    private PlanStage planStage = PlanStage.FOUNDATION;

    @Column(name = "current_task_id")
    private String currentTaskId;

    @Column(name = "pass_accuracy_default", nullable = false)
    private Integer passAccuracyDefault = 70;

    /** Thứ tự plan theo user + examType (Plan #1, #2, …). */
    @Column(name = "plan_sequence")
    private Integer planSequence;

    /** Plan mới thay thế plan này (khi status = REPLACED). */
    @Column(name = "replaced_by_plan_id")
    private String replacedByPlanId;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Status {
        /** Plan đang học. */
        ACTIVE,
        /** Đã pass hết ải hoặc user hoàn tất. */
        COMPLETED,
        /** User / hệ thống bỏ plan. */
        ABANDONED,
        /** Có plan mới sinh từ mock sau — giữ lịch sử, không sửa ải. */
        REPLACED
    }
}
