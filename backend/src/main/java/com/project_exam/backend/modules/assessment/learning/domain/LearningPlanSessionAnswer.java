package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "learning_plan_session_answers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "question_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlanSessionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "question_id", nullable = false)
    private String questionId;

    @Column(name = "selected_answer_id")
    private String selectedAnswerId;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false;
}
