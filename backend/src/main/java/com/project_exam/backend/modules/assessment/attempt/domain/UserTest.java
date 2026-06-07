package com.project_exam.backend.modules.assessment.attempt.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String userTestId;

    // Nullable: guest không có userId, phải dùng guestSessionId.
    private String userId; // FK -> users.user_id

    // Định danh phiên cho guest (UUID do client sinh, lưu trong localStorage).
    @Column(name = "guest_session_id", length = 64)
    private String guestSessionId;

    @Column(nullable = false)
    private String testId; // FK -> tests.test_id

    @Column(nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime finishedAt;

    private Integer totalScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.IN_PROGRESS; // 🟢 mặc định khi bắt đầu thi

    @Version
    private Long version;

    public enum Status {
        IN_PROGRESS,
        COMPLETED,
        EXPIRED
    }
}
