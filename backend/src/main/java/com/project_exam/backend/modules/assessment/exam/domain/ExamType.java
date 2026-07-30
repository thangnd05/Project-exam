package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "exam_types", indexes = {
        @Index(name = "idx_exam_types_parent_id", columnList = "parent_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExamType {

    @Id
    @UuidV7
    private String examTypeId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(nullable = true)
    private Integer durationMinutes;

    @Column(name = "scoring_method", nullable = false, length = 50)
    private String scoringMethod = "DEFAULT";

    @Column(name = "flexible")
    private Boolean flexible = Boolean.FALSE;

    @Column(name = "parent_id")
    private String parentId;

}
