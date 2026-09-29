package com.project_exam.backend.modules.assessment.exam.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "recovery_resources", schema = "assessment", indexes = {
        @Index(name = "idx_recovery_resources_exam_type_id", columnList = "exam_type_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE assessment.recovery_resources SET deleted_at = now() WHERE resource_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class RecoveryResource {

    @Id
    @UuidV7
    private String resourceId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String url;

    @Column(name = "original_file_name")
    private String originalFileName;

    @Column(name = "cloudinary_public_id")
    private String cloudinaryPublicId;

    // Phần thi không lưu ở đây: suy ra từ tag, vì một tài liệu có thể phủ nhiều phần thi.
    @Column(name = "exam_type_id")
    private String examTypeId;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

}
