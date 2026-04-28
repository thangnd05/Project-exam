package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

import java.util.List;

/** Tạo nhiều câu hỏi thông thường vào kho (không passage). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BulkCreateQuestionsToBankRequest {
    private String examPartId;
    private String classId;
    private String chapterId;
    private List<NormalQuestionRequest> questions;
}
