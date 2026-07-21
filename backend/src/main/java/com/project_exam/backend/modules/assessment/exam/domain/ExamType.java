package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "exam_types", indexes = {
        @Index(name = "idx_exam_types_parent_id", columnList = "parent_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExamType {

    @Id
    @UuidV7
    private String examTypeId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /** Gợi ý mặc định theo loại kỳ thi; hệ thống không đọc field này cho chấm điểm hay đếm giờ (dùng {@code Test#durationMinutes}). */
    @Column(nullable = true)
    private Integer durationMinutes;

    @Column(name = "scoring_method", nullable = false, length = 50)
    private String scoringMethod = "DEFAULT";

    /** Loại "linh hoạt" (vd Thông Thường) cho user tự tạo bài; có thể ẩn khỏi dropdown loại kỳ thi chuẩn. */
    @Column(name = "flexible")
    private Boolean flexible = Boolean.FALSE;

    /**
     * examType cha (FK -> exam_types.exam_type_id, nullable). null = examType gốc/lá độc lập.
     * <p>Chỉ để gom nhóm các kỳ thi khác cấu trúc dưới 1 thương hiệu (vd "AWS" chứa 12 cert).
     * examType cha là node gom: không có Part và không gắn test trực tiếp; chỉ examType lá mới có
     * Part + test. Hỗ trợ tối đa 2 cấp (cha con).
     */
    @Column(name = "parent_id")
    private String parentId;

}
