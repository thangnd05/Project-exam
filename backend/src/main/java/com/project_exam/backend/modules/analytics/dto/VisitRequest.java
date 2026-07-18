package com.project_exam.backend.modules.analytics.dto;

import lombok.Data;

/** Payload FE gửi mỗi lần vào/chuyển trang. */
@Data
public class VisitRequest {
    private String path;
}
