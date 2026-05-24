package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "learning_plan_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlanTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String taskId;

    @Column(name = "learning_plan_id", nullable = false)
    private String learningPlanId;

    @Column(name = "tag_id")
    private String tagId;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 30)
    private PlanTaskType taskType = PlanTaskType.TAG;

    /** Số câu mục tiêu phiên học (50 tag / 200% Part cho capstone). */
    @Column(name = "target_question_count")
    private Integer targetQuestionCount;

    @Column(name = "exam_part_id", nullable = false)
    private String examPartId;

    @Column(name = "task_order", nullable = false)
    private Integer taskOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.LOCKED;

    @Column(name = "pass_accuracy", nullable = false)
    private Integer passAccuracy = 70;

    @Column(name = "baseline_accuracy", precision = 5, scale = 2)
    private BigDecimal baselineAccuracy;

    @Column(name = "best_accuracy", precision = 5, scale = 2)
    private BigDecimal bestAccuracy;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "passed_at")
    private Instant passedAt;

    /** Ưu tiên gợi ý học (cao = nên học trước). */
    @Column(name = "priority_score", nullable = false)
    private Integer priorityScore = 0;

    @Column(name = "wrong_count_at_diagnosis")
    private Integer wrongCountAtDiagnosis;
}
