package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "exam_parts", indexes = {
        @Index(name = "idx_exam_parts_exam_type_id", columnList = "exam_type_id"),
        @Index(name = "idx_exam_parts_skill_id", columnList = "skill_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExamPart {

    @Id
    @UuidV7
    private String examPartId;

    @Column(nullable = false)
    private String examTypeId; // FK -> exam_types

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "default_num_questions")
    private Integer defaultNumQuestions;

    @Column(nullable = true)
    private String skillId; // FK -> skills (cho phép null với scoring mặc định)

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 999;
}
