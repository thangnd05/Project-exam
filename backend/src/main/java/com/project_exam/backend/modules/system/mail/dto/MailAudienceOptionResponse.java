package com.project_exam.backend.modules.system.mail.dto;

import lombok.Builder;
import lombok.Getter;

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
