package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/** Tham chiếu 1 câu hỏi trong bảng phân tích theo tag (số câu + trạng thái). */
@Getter
@Setter
@Builder
public class TagQuestionRefDto {
    private String questionId;
    private int questionNumber;
    /** "correct" | "wrong" | "skipped" */
    private String status;
}
