package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "questions", indexes = {
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

    /**
     * Câu này sinh ra để ra đề thi hay để ôn tập. Hai luồng bốc câu (tạo đề từ kho
     * và sinh phiên lộ trình) trước đây múc chung một hồ nên câu ôn tập lọt vào đề
     * và ngược lại; cột này là ranh giới đó.
     */
    @Column(name = "usage_scope", nullable = false)
    @Enumerated(EnumType.STRING)
    private UsageScope usageScope = UsageScope.EXAM;

    public enum UsageScope {
        /** Chỉ dùng khi ra đề thi. */
        EXAM,
        /** Chỉ dùng cho lộ trình học và các phiên ôn tập. */
        PRACTICE;

        /**
         * Tập scope mà mỗi luồng được phép bốc. Tách hằng số ở đây để nếu sau này
         * thêm giá trị (ví dụ BOTH dùng được cả hai) thì chỉ sửa đúng hai dòng này,
         * không phải đi lục lại hơn hai chục câu query.
         */
        public static final List<UsageScope> FOR_EXAM = List.of(EXAM);
        public static final List<UsageScope> FOR_PRACTICE = List.of(PRACTICE);

        /** Bản chuỗi cho các native query (so sánh thẳng với cột varchar). */
        public static final List<String> FOR_EXAM_NAMES = List.of(EXAM.name());
        public static final List<String> FOR_PRACTICE_NAMES = List.of(PRACTICE.name());
    }

}
