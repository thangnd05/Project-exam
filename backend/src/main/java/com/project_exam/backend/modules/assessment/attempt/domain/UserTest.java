package com.project_exam.backend.modules.assessment.attempt.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "user_tests", schema = "assessment",
        indexes = {
                @Index(name = "idx_user_tests_user_id", columnList = "user_id"),
                @Index(name = "idx_user_tests_test_id", columnList = "test_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE assessment.user_tests SET deleted_at = now() WHERE user_test_id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public class UserTest {

    @Id
    @UuidV7
    private String userTestId;

    private String userId;

    @Column(name = "guest_session_id", length = 64)
    private String guestSessionId;

    @Column(nullable = false)
    private String testId;

    @Column(nullable = false)
    private Instant startedAt = Instant.now();

    private Instant finishedAt;

    private Integer totalScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.IN_PROGRESS;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Mode mode = Mode.FULL_TEST;

    @Column(name = "practice_part_ids", length = 500)
    private String practicePartIds;

    @Version
    private Long version;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public enum Status {
        IN_PROGRESS,
        COMPLETED,
        EXPIRED
    }

    public enum Mode {
        FULL_TEST,
        PRACTICE
    }

    public boolean isPractice() {
        return mode == Mode.PRACTICE;
    }
}
