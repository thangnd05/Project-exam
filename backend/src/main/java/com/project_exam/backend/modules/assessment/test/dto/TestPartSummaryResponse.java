package com.project_exam.backend.modules.assessment.test.dto;

import lombok.*;

/**
 * Tóm tắt 1 Part của đề để dựng modal "Chọn chế độ" (luyện tập theo Part):
 * không kèm câu hỏi, chỉ đủ để hiển thị tên Part + số câu + nhóm section.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestPartSummaryResponse {
    private String testPartId;
    private String examPartId;
    private String partName;       // ExamPart.name (vd "Part 1")
    private String skillName;      // "Listening" / "Reading" (null nếu không gắn skill)
    private Integer questionCount;
    private Integer displayOrder;
}
