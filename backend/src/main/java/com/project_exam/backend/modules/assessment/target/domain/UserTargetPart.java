package com.project_exam.backend.modules.assessment.target.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_target_parts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_target_id", "exam_part_id"}),
        indexes = {
                @Index(name = "idx_user_target_parts_exam_part_id", columnList = "exam_part_id"),
                @Index(name = "idx_user_target_parts_last_user_test_id", columnList = "last_user_test_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTargetPart {

    @Id
    @UuidV7
    private String userTargetPartId;

    @Column(name = "user_target_id", nullable = false)
    private String userTargetId;

    @Column(name = "exam_part_id", nullable = false)
    private String examPartId;

    /** Ngưỡng % cần đạt trên Part (aim) — không phải điểm mock hiện tại. */
    @Column(nullable = false)
    private Integer customPercentage;

    /** % đúng Part từ mock gần nhất (cập nhật khi sinh plan / sau mock). */
    @Column(name = "current_score", precision = 5, scale = 2)
    private BigDecimal currentScore;

    @Column(name = "last_user_test_id")
    private String lastUserTestId;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
