package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "recovery_resources", indexes = {
        @Index(name = "idx_recovery_resources_exam_type_id", columnList = "exam_type_id"),
        @Index(name = "idx_recovery_resources_exam_part_id", columnList = "exam_part_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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

    @Column(name = "exam_type_id")
    private String examTypeId;

    @Column(name = "exam_part_id")
    private String examPartId;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

}
