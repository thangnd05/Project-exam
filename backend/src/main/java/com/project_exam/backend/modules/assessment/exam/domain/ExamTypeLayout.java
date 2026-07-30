package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

/**
 * Cấu hình bố cục giao diện làm bài, gắn theo {@link ExamType} (1-1 qua examTypeId unique).
 * <p>Tách riêng bảng để KHÔNG đụng vào entity {@code ExamType} sẵn có. Mọi đề (Test) thuộc
 * một examType dùng chung layout này; nếu examType lá chưa có, FE fallback lên layout của
 * examType cha, rồi cuối cùng về layout mặc định hardcode.
 * <p>{@code config} lưu raw JSON (zone-based schema) để FE tự parse — backend không diễn giải.
 */
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

    // JSON cấu hình bố cục (blocks[], zone, theme...). null = chưa cấu hình -> dùng mặc định.
    @Column(columnDefinition = "TEXT")
    private String config;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();
}
