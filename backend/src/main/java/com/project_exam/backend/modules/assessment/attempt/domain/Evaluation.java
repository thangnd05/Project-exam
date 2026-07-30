package com.project_exam.backend.modules.assessment.attempt.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
