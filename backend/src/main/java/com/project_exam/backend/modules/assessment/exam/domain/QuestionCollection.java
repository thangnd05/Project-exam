package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "question_collections", indexes = {
        @Index(name = "idx_question_collections_parent_id", columnList = "parent_id"),
        @Index(name = "idx_question_collections_exam_type_id", columnList = "exam_type_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCollection {

    @Id
    @UuidV7
    private String collectionId;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Collection cha (FK -> question_collections.collection_id, nullable).
     * <p>null = collection cấp 1 (cha). Có giá trị = collection con của một collection cấp 1.
     * Hệ thống chỉ hỗ trợ tối đa 2 cấp: cha → con (con không được làm cha tiếp).
     */
    @Column(name = "parent_id")
    private String parentId;

    /**
     * Loại kỳ thi mà bộ sưu tập (cấp 1) này thuộc về — vd "ETS 2026" thuộc TOEIC.
     * <p>Gắn ở collection cha; collection con tự kế thừa examTypeId của cha. null = chưa gắn examType.
     * Dùng để liệt kê "examType này có những bộ đề (folder) nào".
     */
    @Column(name = "exam_type_id")
    private String examTypeId;

    /**
     * Thứ tự hiển thị trong danh sách/cây (số nhỏ lên trước). null = chưa đặt,
     * khi đó FE sắp theo tên (numeric-aware, "ETS 2026 2" trước "ETS 2026 10").
     * Cho phép admin ghim vị trí cố định cho từng bộ sưu tập.
     */
    @Column(name = "display_order")
    private Integer displayOrder;
}
