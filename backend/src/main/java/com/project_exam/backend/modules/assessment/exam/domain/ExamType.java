package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExamType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String examTypeId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Gợi ý mặc định theo loại kỳ thi; hệ thống không đọc field này cho chấm điểm hay đếm giờ (dùng {@code Test#durationMinutes}). */
    @Column(nullable = true)
    private Integer durationMinutes;

    @Column(name = "scoring_method", nullable = false, length = 50)
    private String scoringMethod = "DEFAULT";

    /** Loại "linh hoạt" (vd Thông Thường) cho user tự tạo bài; có thể ẩn khỏi dropdown loại kỳ thi chuẩn. */
    @Column(name = "flexible")
    private Boolean flexible = Boolean.FALSE;

}
