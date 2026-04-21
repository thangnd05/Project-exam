package com.project_exam.backend.dto.response.user;

import lombok.*;

@Getter
@Setter // 🚀 Thêm Setter để BE có thể gán lại nhãn A, B, C, D
@Builder
@AllArgsConstructor
@NoArgsConstructor // Thêm để hỗ trợ các thư viện mapping nếu cần
public class AnswerResponse {
    private String answerId;
    private String answerText;
    private String answerLabel; // Bỏ final
}