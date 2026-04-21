package com.project_exam.backend.models;

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

    @Column(nullable = false)
    private String userId; // FK -> users.user_id

    @Column(nullable = false)
    private String testId; // FK -> tests.test_id

    @Column(nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime finishedAt;

    private Integer totalScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.IN_PROGRESS; // 🟢 mặc định khi bắt đầu thi

    public enum Status {
        IN_PROGRESS,
        COMPLETED,
        EXPIRED
    }
}
