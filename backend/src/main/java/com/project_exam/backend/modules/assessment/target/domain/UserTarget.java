package com.project_exam.backend.modules.assessment.target.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_targets",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "exam_type_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String userTargetId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "exam_type_id", nullable = false)
    private String examTypeId;

    @Column(name = "target_score", nullable = false)
    private Integer targetScore;

    @Column(name = "exam_target_milestone_id")
    private String examTargetMilestoneId; // nullable — null nếu user nhập score tự do

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
