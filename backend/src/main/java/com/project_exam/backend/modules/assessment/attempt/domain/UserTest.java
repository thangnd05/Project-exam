package com.project_exam.backend.modules.assessment.attempt.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_tests",
        indexes = {
                @Index(name = "idx_user_tests_user_id", columnList = "user_id"),
                @Index(name = "idx_user_tests_test_id", columnList = "test_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTest {

    @Id
    @UuidV7
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
    private Status status = Status.IN_PROGRESS; // mặc định khi bắt đầu thi

    // FULL_TEST = làm cả đề, có giới hạn giờ, tính lượt/xu, lên bảng xếp hạng.
    // PRACTICE  = luyện tập theo Part, không giới hạn giờ, miễn phí/không tốn lượt,
    //             lưu lịch sử nhưng KHÔNG lên bảng xếp hạng.
    // Cột mới (ddl-auto=update) -> row cũ = NULL, được coi như FULL_TEST ở mọi nơi.
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Mode mode = Mode.FULL_TEST;

    // Danh sách examPartId được luyện (CSV đã sort), chỉ có khi mode = PRACTICE.
    // Dùng để tính mẫu số chấm điểm đúng theo số câu của các Part đã chọn.
    @Column(name = "practice_part_ids", length = 500)
    private String practicePartIds;

    @Version
    private Long version;

    public enum Status {
        IN_PROGRESS,
        COMPLETED,
        EXPIRED
    }

    public enum Mode {
        FULL_TEST,
        PRACTICE
    }

    /** Row cũ (mode = NULL) coi như FULL_TEST. */
    public boolean isPractice() {
        return mode == Mode.PRACTICE;
    }
}
