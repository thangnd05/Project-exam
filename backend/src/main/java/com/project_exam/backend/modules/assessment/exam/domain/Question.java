package com.project_exam.backend.modules.assessment.exam.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "questions", schema = "assessment", indexes = {
        @Index(name = "idx_questions_exam_part_id", columnList = "exam_part_id"),
        @Index(name = "idx_questions_passage_id", columnList = "passage_id"),
        @Index(name = "idx_questions_collection_id", columnList = "collection_id"),
        @Index(name = "idx_questions_class_id", columnList = "class_id"),
        @Index(name = "idx_questions_chapter_id", columnList = "chapter_id"),
        @Index(name = "idx_questions_usage_scope", columnList = "exam_part_id, usage_scope")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE assessment.questions SET deleted_at = now() WHERE question_id = ?")
@SQLRestriction("deleted_at IS NULL")
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

    @Column(name = "usage_scope", nullable = false)
    @Enumerated(EnumType.STRING)
    private UsageScope usageScope = UsageScope.EXAM;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public enum UsageScope {

        EXAM,

        PRACTICE;

        public static final List<UsageScope> FOR_EXAM = List.of(EXAM);
        public static final List<UsageScope> FOR_PRACTICE = List.of(PRACTICE);
        public static final List<UsageScope> FOR_ALL = List.of(EXAM, PRACTICE);

        public static final List<String> FOR_EXAM_NAMES = List.of(EXAM.name());
        public static final List<String> FOR_PRACTICE_NAMES = List.of(PRACTICE.name());

        /**
         * Chuyển tham số phạm vi kho câu hỏi (EXAM / PRACTICE / ALL) thành danh sách usage scope.
         * Rỗng hoặc không hợp lệ thì mặc định chỉ lấy câu thi.
         */
        public static List<UsageScope> scopesOf(String param) {
            if (param == null || param.isBlank()) return FOR_EXAM;
            return switch (param.trim().toUpperCase()) {
                case "PRACTICE" -> FOR_PRACTICE;
                case "ALL", "BOTH" -> FOR_ALL;
                default -> FOR_EXAM;
            };
        }
    }

}
