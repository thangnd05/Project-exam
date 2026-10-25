package com.project_exam.backend.modules.system.analytics.dto;

import lombok.Data;

@Data
public class VisitRequest {
    private String path;
    // true = chỉ gắn người dùng vừa đăng nhập vào lượt hiện tại của phiên, không tính lượt mới.
    private boolean identify;
}
