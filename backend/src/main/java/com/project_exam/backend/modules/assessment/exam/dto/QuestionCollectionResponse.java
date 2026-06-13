package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCollectionResponse {
    private String collectionId;
    private String name;
    private String description;
    /** Số câu hỏi đang gắn vào collection này (để admin biết collection có đang được dùng). */
    private Long questionCount;
}
