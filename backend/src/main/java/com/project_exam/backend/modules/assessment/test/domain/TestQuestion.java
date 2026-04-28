package com.project_exam.backend.modules.assessment.test.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "test_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "test_question_id")
    private String testQuestionId;

    @Column(name = "test_part_id", nullable = false)
    private String testPartId;

    @Column(name = "question_id", nullable = false)
    private String questionId;
}
