package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "exam_type_layouts", indexes = {
        @Index(name = "idx_exam_type_layouts_exam_type_id", columnList = "exam_type_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExamTypeLayout {

    @Id
    @UuidV7
    @Column(name = "layout_id")
    private String layoutId;

    @Column(name = "exam_type_id", nullable = false, unique = true)
    private String examTypeId;

    @Column(columnDefinition = "TEXT")
    private String config;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();
}
