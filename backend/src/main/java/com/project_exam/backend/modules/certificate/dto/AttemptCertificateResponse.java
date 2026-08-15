package com.project_exam.backend.modules.certificate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trang kết quả hỏi "lượt làm bài này có chứng chỉ không".
 *
 * state:
 *   NOT_APPLICABLE  đề không thuộc nhóm cấp chứng chỉ, hoặc loại đề chưa có mẫu đang bật
 *   JUST_ISSUED     chính lượt này vừa sinh ra chứng chỉ
 *   ALREADY_OWNED   đã đạt từ lượt trước, lần này không cấp thêm
 *   NOT_PASSED      đề có cấp chứng chỉ nhưng lượt này chưa đủ điểm
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptCertificateResponse {
    private String state;
    private Integer score;
    private Integer passScore;
    /** Còn thiếu bao nhiêu điểm nữa thì đạt, chỉ có nghĩa ở state NOT_PASSED. */
    private Integer pointsToPass;
    private CertificateResponse certificate;
}
