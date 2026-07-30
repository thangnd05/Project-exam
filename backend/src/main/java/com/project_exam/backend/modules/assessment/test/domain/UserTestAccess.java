package com.project_exam.backend.modules.assessment.test.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "user_test_accesses",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "test_id"}),
        indexes = {
                @Index(name = "idx_user_test_accesses_test_id", columnList = "test_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTestAccess {
    @Id
    @UuidV7
    private String userTestAccessId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String testId;

    @Column(nullable = false)
    private Instant purchasedAt = Instant.now();
}
