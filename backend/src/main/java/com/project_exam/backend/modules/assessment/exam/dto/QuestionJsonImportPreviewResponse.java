package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionJsonImportPreviewResponse {

    /** true khi không còn lỗi chặn import. */
    private boolean valid;

    private int questionCount;
    private int groupCount;

    private List<String> errors;
    private List<String> warnings;

    private List<NormalQuestionRequest> questions;
    private List<PassageQuestionGroupRequest> groups;
}
