package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;
import java.util.List;

@Data
public class BulkQuestionWithPassageRequest {

    private String examPartId;

    private String classId;
    private String chapterId;

    private PassageRequest passage;
    private List<NormalQuestionRequest> questions;
}
