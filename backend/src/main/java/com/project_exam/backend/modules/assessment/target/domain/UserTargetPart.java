package com.project_exam.backend.modules.assessment.target.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_target_parts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_target_id", "exam_part_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTargetPart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String userTargetPartId;

    @Column(name = "user_target_id", nullable = false)
    private String userTargetId;

    @Column(name = "exam_part_id", nullable = false)
    private String examPartId;

    @Column(nullable = false)
    private Integer customPercentage;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
