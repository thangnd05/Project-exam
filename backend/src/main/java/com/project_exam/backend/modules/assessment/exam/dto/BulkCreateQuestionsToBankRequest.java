package com.project_exam.backend.modules.assessment.exam.dto;

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
}
