package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;
import java.util.List;

@Data
public class BulkQuestionWithPassageRequest {

    private String examPartId;

    // 🔑 bắt buộc
    private String classId;
    private String chapterId;

    private PassageRequest passage; // chung cho tất cả question
    private List<NormalQuestionRequest> questions;
}
