package com.project_exam.backend.modules.assessment.attempt.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(
        name = "user_answers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_test_id", "question_id"}),
        indexes = {
                @Index(name = "idx_user_answers_question_id", columnList = "question_id"),
                @Index(name = "idx_user_answers_selected_answer_id", columnList = "selected_answer_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAnswer {

    @Id
    @UuidV7
    private String userAnswerId;

    @Column(nullable = false)
    private String userTestId;

    @Column(nullable = false)
    private String questionId;

    private String selectedAnswerId;

    @Column(name = "selected_answer_ids", columnDefinition = "TEXT")
    private String selectedAnswerIds;

    @Column(columnDefinition = "TEXT")
    private String answerText;

}
