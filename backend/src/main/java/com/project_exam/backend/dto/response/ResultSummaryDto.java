package com.project_exam.backend.dto.response;

// Dùng record cho DTO đơn giản là cách làm hiện đại và gọn gàng
public record ResultSummaryDto(long correct, long wrong, long total,long totalScore) {
}