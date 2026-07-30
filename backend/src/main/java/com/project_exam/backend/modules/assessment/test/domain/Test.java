package com.project_exam.backend.modules.assessment.test.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "tests",
        indexes = {
                @Index(name = "idx_tests_exam_type_id", columnList = "exam_type_id"),
                @Index(name = "idx_tests_class_id", columnList = "class_id"),
                @Index(name = "idx_tests_chapter_id", columnList = "chapter_id"),
                @Index(name = "idx_tests_exam_category_id", columnList = "exam_category_id"),
                @Index(name = "idx_tests_collection_id", columnList = "collection_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Test {
    @Id
    @UuidV7
    private String testId;

    @Column(nullable = false, length = 255)
    private String title;

    private String description;

    @Column(nullable = false)
    private String examTypeId;

    private String createdBy;

    private Instant createdAt = Instant.now();

    @Column(nullable = true)
    private Integer durationMinutes;

    private Instant availableFrom;

    private Instant availableTo;

    @Column(length = 500)
    private String bannerUrl;

    private Integer maxAttempts;

    @Column(name = "class_id")
    private String classId;

    @Column(name ="chapter_id")
    private String chapterId;

    @Column(name = "exam_category_id")
    private String examCategoryId;

    @Column(name = "collection_id")
    private String collectionId;

    @Column(name = "cost_coins")
    private Integer costCoins;

    public TestStatus calculateStatus() {
        Instant now = Instant.now();
        if (availableFrom == null && availableTo == null) {
            return TestStatus.OPEN;
        }
        if (availableFrom != null && now.isBefore(availableFrom)) {
            return TestStatus.NOT_STARTED;
        }
        if (availableTo != null && now.isAfter(availableTo)) {
            return TestStatus.ENDED;
        }
        return TestStatus.OPEN;
    }

}
