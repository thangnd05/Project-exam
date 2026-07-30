package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "learning_plans", indexes = {
        @Index(name = "idx_learning_plans_user_id", columnList = "user_id"),
        @Index(name = "idx_learning_plans_exam_type_id", columnList = "exam_type_id"),
        @Index(name = "idx_learning_plans_source_user_test_id", columnList = "source_user_test_id"),
        @Index(name = "idx_learning_plans_user_target_id", columnList = "user_target_id"),
        @Index(name = "idx_learning_plans_replaced_by_plan_id", columnList = "replaced_by_plan_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlan {

    @Id
    @UuidV7
    private String learningPlanId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "exam_type_id", nullable = false)
    private String examTypeId;

    @Column(name = "source_user_test_id", nullable = false)
    private String sourceUserTestId;

    @Column(name = "target_score")
    private Integer targetScore;

    @Column(name = "user_target_id")
    private String userTargetId;

    @Column(name = "deadline_days")
    private Integer deadlineDays;

    @Column(name = "baseline_readiness")
    private Integer baselineReadiness;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_stage", length = 20, nullable = false)
    private PlanStage planStage = PlanStage.FOUNDATION;

    @Column(name = "pass_accuracy_default", nullable = false)
    private Integer passAccuracyDefault = 70;

    @Column(name = "plan_sequence")
    private Integer planSequence;

    @Column(name = "replaced_by_plan_id")
    private String replacedByPlanId;

    @Column(name = "parts_without_tasks", columnDefinition = "TEXT")
    private String partsWithoutTasks;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Status {

        ACTIVE,

        COMPLETED,

        REPLACED
    }
}
