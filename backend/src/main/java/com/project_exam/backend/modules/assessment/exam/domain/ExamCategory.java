package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_categories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ExamCategory {

    @Id
    @UuidV7
    @Column(name = "exam_category_id")
    private String examCategoryId;

    // Định danh để code check logic (QUICK_CHALLENGE, FULL_MOCK, RECOVERY...)
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Giữ cái này vì nó quyết định access flow (P0 trong PRD)
    @Column(name = "guest_allowed", nullable = false)
    private Boolean guestAllowed = false;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
