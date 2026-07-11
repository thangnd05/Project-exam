package com.project_exam.backend.modules.assessment.test.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thẻ "bộ đề" (folder) trên trang khám phá: gom các đề theo collection cha của một loại kỳ thi.
 * Bấm vào folder xem danh sách đề bên trong (gộp cả collection con).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCollectionResponse {
    private String collectionId;
    private String name;
    private String description;
    /** Số đề (công khai, admin tạo) thuộc folder này, đã gộp các collection con. */
    private long testCount;
}
