package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "tags", schema = "assessment", indexes = {
        @Index(name = "idx_tags_exam_type_id", columnList = "exam_type_id"),
        @Index(name = "idx_tags_exam_part_id", columnList = "exam_part_id")
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
    private String examTypeId;

    // null = tag dùng chung cho mọi phần thi của exam type.
    @Column(name = "exam_part_id")
    private String examPartId;

    @Column(name = "sort_order")
    private Integer sortOrder;

}
