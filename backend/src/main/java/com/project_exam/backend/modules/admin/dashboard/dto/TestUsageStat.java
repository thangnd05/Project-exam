package com.project_exam.backend.modules.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Lượt làm của một đề công khai, gộp cả thi thật lẫn ôn luyện.
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestUsageStat {
    private String testId;
    private String title;
    private long attempts;
    // Số người làm khác nhau: tài khoản hoặc phiên khách.
    private long users;
}
