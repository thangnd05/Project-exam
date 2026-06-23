package com.project_exam.backend.modules.assessment.attempt.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "evaluation",
        indexes = {
                @Index(name = "idx_evaluation_user_id", columnList = "user_id")
        })
public class Evaluation {

    @Id
    @UuidV7
    private String id;

    // FK tới users
    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private Integer rating;

    @Column(name = "createdAt")
    private LocalDateTime createdAt = LocalDateTime.now();
}
