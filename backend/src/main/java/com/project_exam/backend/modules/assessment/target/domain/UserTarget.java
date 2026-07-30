package com.project_exam.backend.modules.assessment.target.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_targets",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "exam_type_id"}),
        indexes = {
                @Index(name = "idx_user_targets_exam_type_id", columnList = "exam_type_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTarget {

    @Id
    @UuidV7
    private String userTargetId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "exam_type_id", nullable = false)
    private String examTypeId;

    @Column(name = "target_score", nullable = false)
    private Integer targetScore;

    /** Mục tiêu readiness % (tùy chọn, bổ sung target_score). */
    @Column(name = "target_readiness")
    private Integer targetReadiness;

    @Column(name = "achieved_at")
    private Instant achievedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
