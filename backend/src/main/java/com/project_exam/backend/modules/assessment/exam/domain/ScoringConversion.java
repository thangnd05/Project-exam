package com.project_exam.backend.modules.assessment.exam.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.Instant;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "scoring_conversion", schema = "assessment",
        uniqueConstraints = @UniqueConstraint(name = "uk_scoring", columnNames = {"exam_type_id", "skill_id", "num_correct"}),
        indexes = {
                @Index(name = "idx_scoring_conversion_skill_id", columnList = "skill_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE assessment.scoring_conversion SET deleted_at = now() WHERE conversion_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class ScoringConversion {
    @Id
    @UuidV7
    private String conversionId;

    @Column(nullable = false)
    private String examTypeId;

    @Column(nullable = false)
    private String skillId;

    @Column(nullable = false)
    private Integer numCorrect;

    @Column(nullable = false)
    private Integer convertedScore;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
