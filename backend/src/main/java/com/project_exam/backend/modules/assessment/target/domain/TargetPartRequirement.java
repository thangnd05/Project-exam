package com.project_exam.backend.modules.assessment.target.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "target_part_requirements",
        uniqueConstraints = @UniqueConstraint(columnNames = {"exam_target_milestone_id", "exam_part_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TargetPartRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String targetPartRequirementId;

    @Column(name = "exam_target_milestone_id", nullable = false)
    private String examTargetMilestoneId;

    @Column(name = "exam_part_id", nullable = false)
    private String examPartId;

    @Column(nullable = false)
    private Integer requiredPercentage;
}
