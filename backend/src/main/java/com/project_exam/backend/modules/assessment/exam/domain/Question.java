package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "questions", indexes = {
        @Index(name = "idx_questions_exam_part_id", columnList = "exam_part_id"),
        @Index(name = "idx_questions_passage_id", columnList = "passage_id"),
        @Index(name = "idx_questions_collection_id", columnList = "collection_id"),
        @Index(name = "idx_questions_class_id", columnList = "class_id"),
        @Index(name = "idx_questions_chapter_id", columnList = "chapter_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @UuidV7
    private String questionId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private String examPartId;

    private String passageId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    private String createdBy;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private QuestionType questionType;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    public enum QuestionType {
        MCQ,
        MSQ,
        FILL_BLANK,
        ESSAY
    }

    @Column(name = "class_id")
    private String classId;

    @Column(name ="chapter_id")
    private String chapterId;

    @Column(name = "is_bank")
    private Boolean isBank;

    @Column(name = "collection_id")
    private String collectionId;

    @Column(name = "question_number")
    private Integer questionNumber;

}
