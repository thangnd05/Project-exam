package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "exam_categories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ExamCategory {

    @Id
    @UuidV7
    @Column(name = "exam_category_id")
    private String examCategoryId;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "guest_allowed", nullable = false)
    private Boolean guestAllowed = false;

    /**
     * Bài thi thuộc nhóm này khi đạt điểm thì được cấp chứng chỉ. Đặt cờ ở đây thay vì
     * dò code 'FULL_MOCK' trong Java để admin đổi/thêm nhóm đề không phải sửa code.
     */
    @Column(name = "certificate_eligible", nullable = false)
    private Boolean certificateEligible = false;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
