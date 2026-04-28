package com.project_exam.backend.modules.vocabulary.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_vocabulary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserVocabulary {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId; // FK -> users.user_id

    @Column(nullable = false)
    private String vocabId; // FK -> vocabulary.vocab_id

    @Enumerated(EnumType.STRING)
    private Status status = Status.learning;

    private LocalDateTime lastReviewed = LocalDateTime.now();
    private int correctCount = 0; // số lần trả lời đúng liên tiếp

    public UserVocabulary(String currentUserId, String vocabId) {
        this.userId = currentUserId;
        this.vocabId = vocabId;
    }

    public enum Status {
        learning,
        mastered
    }
}
