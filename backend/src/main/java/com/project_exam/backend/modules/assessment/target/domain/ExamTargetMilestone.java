package com.project_exam.backend.modules.assessment.target.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "exam_target_milestones", schema = "assessment",
        uniqueConstraints = @UniqueConstraint(columnNames = {"exam_type_id", "milestone_score"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE assessment.exam_target_milestones SET deleted_at = now() WHERE exam_target_milestone_id = ?")
@SQLRestriction("deleted_at IS NULL")
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
    private Instant createdAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
