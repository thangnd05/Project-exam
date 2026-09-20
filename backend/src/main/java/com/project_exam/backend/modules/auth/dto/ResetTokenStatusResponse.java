package com.project_exam.backend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetTokenStatusResponse {
    /** Token còn dùng được hay không. */
    private boolean valid;
    /** Lý do không hợp lệ (null khi valid = true). */
    private String reason;
    /** Email đã che bớt của chủ token, chỉ trả về khi token hợp lệ. */
    private String maskedEmail;
    /** Số giây còn lại trước khi token hết hạn, chỉ trả về khi token hợp lệ. */
    private Long expiresInSeconds;
}
