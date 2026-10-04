package com.project_exam.backend.modules.assessment.test.dto;

import com.project_exam.backend.modules.assessment.exam.dto.NormalQuestionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageQuestionGroupRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Kết quả dry-run khi tạo đề từ JSON: số câu sẽ rơi vào từng phần thi. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestJsonImportPreviewResponse {

    private boolean valid;

    private int questionCount;

    private List<String> errors;
    private List<String> warnings;

    private List<PartSummary> parts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartSummary {
        private String examPartId;
        private String examPartName;
        private int questionCount;
        private int groupCount;
        /** Câu sẽ vào part này, theo thứ tự trong đề (câu độc lập trước, nhóm sau). */
        private List<NormalQuestionRequest> questions;
        private List<PassageQuestionGroupRequest> groups;
    }
}
