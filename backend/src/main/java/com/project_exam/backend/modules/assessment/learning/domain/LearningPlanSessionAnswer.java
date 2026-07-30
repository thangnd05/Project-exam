package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "learning_plan_session_answers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "question_id"}),
        indexes = {
                @Index(name = "idx_lps_answers_question_id", columnList = "question_id"),
                @Index(name = "idx_lps_answers_selected_answer_id", columnList = "selected_answer_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlanSessionAnswer {

    @Id
    @UuidV7
    private String id;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "question_id", nullable = false)
    private String questionId;

    @Column(name = "selected_answer_id")
    private String selectedAnswerId;

    @Column(name = "selected_answer_ids", columnDefinition = "TEXT")
    private String selectedAnswerIds;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false;
}
