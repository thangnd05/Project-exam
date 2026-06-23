package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "learning_plan_sessions", indexes = {
        // learning_plan_id đã được index dẫn đầu bởi idx_learning_plan_sessions_plan_status (learning_plan_id, status)
        @Index(name = "idx_learning_plan_sessions_task_id", columnList = "task_id"),
        @Index(name = "idx_learning_plan_sessions_resource_id", columnList = "resource_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlanSession {

    @Id
    @UuidV7
    private String sessionId;

    @Column(name = "learning_plan_id", nullable = false)
    private String learningPlanId;

    @Column(name = "task_id")
    private String taskId;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_stage", nullable = false, length = 20)
    private PlanStage planStage;

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    @Column(name = "accuracy")
    private Integer accuracy;

    @Column(name = "passed")
    private Boolean passed;

    /** True khi session bị huỷ tự động (user switch task), phân biệt với fail thật 0%. */
    @Column(name = "abandoned", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean abandoned = false;

    @CreationTimestamp
    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;
}
