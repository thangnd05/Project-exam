package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "tags", indexes = {
        @Index(name = "idx_tags_exam_type_id", columnList = "exam_type_id"),
        @Index(name = "idx_tags_parent_id", columnList = "parent_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Tag {

    @Id
    @UuidV7
    private String tagId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "exam_type_id", nullable = false)
    private String examTypeId; // FK -> exam_types

    @Column(name = "parent_id")
    private String parentId; // FK -> tags (nullable, tạo cấu trúc cây)

}
