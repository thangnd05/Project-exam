package com.project_exam.backend.modules.assessment.test.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Test {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String testId;

    @Column(nullable = false, length = 255)
    private String title;

    private String description;

    @Column(nullable = false)
    private String examTypeId;

    private String createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Thời gian giới hạn làm bài (null = không giới hạn)
    @Column(nullable = true)
    private Integer durationMinutes;

    // Khoảng thời gian mở đề (optional)
    private LocalDateTime availableFrom;

    private LocalDateTime availableTo;

    @Column(length = 500) // đủ dài để chứa URL
    private String bannerUrl;

    // Số lần làm bài cho phép (null = không giới hạn)
    private Integer maxAttempts;

    @Column(name = "class_id")
    private String classId; // FK -> exam_parts

    @Column(name ="chapter_id")
    private String chapterId;

    // Phân loại bài thi (Quick Challenge / Full Mock / Recovery / Mini Quiz...)
    // Nullable: test cũ và TOEIC legacy không bắt buộc gắn category.
    @Column(name = "exam_category_id")
    private String examCategoryId; // FK -> exam_categories.exam_category_id

    // Giá xu để mở khoá bài (chỉ admin đặt, chỉ áp dụng cho bài công khai).
    // null/0 = miễn phí; >0 = user phải mua 1 lần để mở khoá vĩnh viễn.
    @Column(name = "cost_coins")
    private Integer costCoins;

    //  Method tính trạng thái thực tế
    public TestStatus calculateStatus() {
        LocalDateTime now = LocalDateTime.now();
        if (availableFrom == null && availableTo == null) {
            return TestStatus.OPEN; // luôn mở
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
