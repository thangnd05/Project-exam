package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "user_question_exposures",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_id"}),
        indexes = {
                @Index(name = "idx_user_question_exposures_question_id", columnList = "question_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserQuestionExposure {

    @Id
    @UuidV7
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "question_id", nullable = false)
    private String questionId;

    @CreationTimestamp
    @Column(name = "first_seen_at", nullable = false, updatable = false)
    private Instant firstSeenAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt = Instant.now();

    @Column(name = "times_seen", nullable = false)
    private Integer timesSeen = 1;
}
