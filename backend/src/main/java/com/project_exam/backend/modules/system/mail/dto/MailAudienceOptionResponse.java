package com.project_exam.backend.modules.system.mail.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Một người dùng có thể chọn làm người nhận. Trả về cả roleName/isPremium để giao diện tự
 * lọc (theo vai trò, theo premium) mà backend không cần biết khái niệm "nhóm người nhận".
 */
@Getter
@Builder
public class MailAudienceOptionResponse {
    private String userId;
    private String userName;
    private String fullName;
    private String email;
    private String roleId;
    private String roleName;
    private Boolean isPremium;
}
