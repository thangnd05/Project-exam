package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "learning_plan_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlanSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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

    @CreationTimestamp
    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;
}
