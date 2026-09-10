package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import lombok.Data;
import java.util.List;

@Data
public class BulkQuestionWithPassageRequest {

    private String examPartId;

    private String classId;
    private String chapterId;

    private PassageRequest passage;
    private List<NormalQuestionRequest> questions;

    /** Áp cho cả lô: import một file Word thì cả file là câu thi hoặc cả file là câu ôn tập. */
    private Question.UsageScope usageScope;
}
