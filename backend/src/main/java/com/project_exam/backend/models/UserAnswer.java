package com.project_exam.backend.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_answers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_test_id", "question_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String userAnswerId;

    @Column(nullable = false)
    private String userTestId; // FK -> user_tests.user_test_id

    @Column(nullable = false)
    private String questionId; // FK -> questions.question_id

    private String selectedAnswerId; // FK -> answers.answer_id (null nếu tự luận)

    @Column(columnDefinition = "TEXT")
    private String answerText; // cho tự luận

}
