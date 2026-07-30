package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "learning_plan_phases", indexes = {
        @Index(name = "idx_learning_plan_phases_learning_plan_id", columnList = "learning_plan_id"),
        @Index(name = "idx_learning_plan_phases_exam_part_id", columnList = "exam_part_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlanPhase {

    @Id
    @UuidV7
    private String phaseId;

    @Column(name = "learning_plan_id", nullable = false)
    private String learningPlanId;

    @Column(name = "exam_part_id", nullable = false)
    private String examPartId;

    @Column(name = "phase_order", nullable = false)
    private Integer phaseOrder;

    @Column(name = "days_allocated", nullable = false)
    private Integer daysAllocated;

    @Column(name = "practice_size", nullable = false)
    private Integer practiceSize;

    @Column(name = "weakness_score", precision = 6, scale = 2)
    private BigDecimal weaknessScore;

    @Column(name = "current_percentage", precision = 5, scale = 2)
    private BigDecimal currentPercentage;

    @Column(name = "weak_tag_ids", columnDefinition = "TEXT")
    private String weakTagIds;

    @Column(name = "completed_practices", nullable = false)
    private Integer completedPractices = 0;
}
