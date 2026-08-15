package com.project_exam.backend.modules.assessment.test.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Khu "thi lấy chứng chỉ" của một loại đề: các đề thuộc nhóm đề có cấp chứng chỉ,
 * kèm điều kiện đạt lấy từ mẫu chứng chỉ đang bật.
 *
 * Danh sách rỗng khi loại đề chưa có mẫu chứng chỉ bật hoặc chưa có đề nào thuộc nhóm
 * cấp chứng chỉ — frontend cứ thế ẩn cả khu, không phải tự suy luận.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateExamListResponse {

    private List<TestResponse> tests;

    /** Tên chứng chỉ sẽ nhận được, lấy từ mẫu. */
    private String certificateTitle;
    private Integer passScore;
    private Integer validMonths;

    /** Người đang đăng nhập đã có chứng chỉ còn hiệu lực của loại đề này chưa. */
    private boolean alreadyOwned;

    public static CertificateExamListResponse empty() {
        return CertificateExamListResponse.builder()
                .tests(List.of())
                .alreadyOwned(false)
                .build();
    }
}
