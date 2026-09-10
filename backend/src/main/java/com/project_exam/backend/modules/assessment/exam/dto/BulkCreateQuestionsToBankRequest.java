package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BulkCreateQuestionsToBankRequest {
    private String examPartId;
    private String classId;
    private String chapterId;
    private List<NormalQuestionRequest> questions;

    /** Áp cho cả lô, xem ghi chú ở BulkQuestionWithPassageRequest. */
    private Question.UsageScope usageScope;
}
