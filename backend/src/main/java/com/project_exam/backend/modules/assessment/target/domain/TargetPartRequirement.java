package com.project_exam.backend.modules.assessment.target.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "target_part_requirements",
        uniqueConstraints = @UniqueConstraint(columnNames = {"exam_target_milestone_id", "exam_part_id"}),
        indexes = {
                @Index(name = "idx_target_part_requirements_exam_part_id", columnList = "exam_part_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TargetPartRequirement {

    @Id
    @UuidV7
    private String targetPartRequirementId;

    @Column(name = "exam_target_milestone_id", nullable = false)
    private String examTargetMilestoneId;

    @Column(name = "exam_part_id", nullable = false)
    private String examPartId;

    @Column(nullable = false)
    private Integer requiredPercentage;
}
