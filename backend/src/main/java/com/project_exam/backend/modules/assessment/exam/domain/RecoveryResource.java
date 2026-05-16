package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "recovery_resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryResource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String resourceId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String url;

    @Column(name = "original_file_name")
    private String originalFileName; // tên file gốc khi upload (VD: "bai-giang.pdf")

    @Column(name = "cloudinary_public_id")
    private String cloudinaryPublicId;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
    private Instant createdAt;

}
