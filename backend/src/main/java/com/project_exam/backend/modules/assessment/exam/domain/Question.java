package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String questionId;

    @Column(nullable = false)
    private String examPartId; // FK -> exam_parts

    private String passageId; // FK -> passages (nullable)

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    private String createdBy;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private QuestionType questionType;

    @Column(columnDefinition = "TEXT")
    private String explanation; // optional: có thể AI generate

    public enum QuestionType {
        MCQ, FILL_BLANK, ESSAY
    }

    @Column(name = "class_id")
    private String classId;

    @Column(name ="chapter_id")
    private String chapterId;

    @Column(name = "is_bank")
    private Boolean isBank;

    @Column(name = "collection_id")
    private String collectionId; // FK -> question_collections (nullable)

}
