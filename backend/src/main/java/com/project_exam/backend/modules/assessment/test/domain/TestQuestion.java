package com.project_exam.backend.modules.assessment.test.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "test_questions",
        indexes = {
                @Index(name = "idx_test_questions_test_part_id", columnList = "test_part_id"),
                @Index(name = "idx_test_questions_question_id", columnList = "question_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestQuestion {

    @Id
    @UuidV7
    @Column(name = "test_question_id")
    private String testQuestionId;

    @Column(name = "test_part_id", nullable = false)
    private String testPartId;

    @Column(name = "question_id", nullable = false)
    private String questionId;

    @Column(name = "display_order")
    private Integer displayOrder;
}
