package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "question_collections", indexes = {
        @Index(name = "idx_question_collections_parent_id", columnList = "parent_id")
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

    /**
     * Collection cha (FK -> question_collections.collection_id, nullable).
     * <p>null = collection cấp 1 (cha). Có giá trị = collection con của một collection cấp 1.
     * Hệ thống chỉ hỗ trợ tối đa 2 cấp: cha → con (con không được làm cha tiếp).
     */
    @Column(name = "parent_id")
    private String parentId;
}
