package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "question_collections", indexes = {
        @Index(name = "idx_question_collections_parent_id", columnList = "parent_id"),
        @Index(name = "idx_question_collections_exam_type_id", columnList = "exam_type_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCollection {

    @Id
    @UuidV7
    private String collectionId;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "parent_id")
    private String parentId;

    @Column(name = "exam_type_id")
    private String examTypeId;

    @Column(name = "display_order")
    private Integer displayOrder;
}
