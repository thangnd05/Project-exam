package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_parts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExamPart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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
