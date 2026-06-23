package com.project_exam.backend.modules.assessment.target.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_target_milestones",
        uniqueConstraints = @UniqueConstraint(columnNames = {"exam_type_id", "milestone_score"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExamTargetMilestone {

    @Id
    @UuidV7
    private String examTargetMilestoneId;

    @Column(name = "exam_type_id", nullable = false)
    private String examTypeId;

    @Column(name = "milestone_score", nullable = false)
    private Integer milestoneScore;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
