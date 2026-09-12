package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateQuestionsRequest {

    @NotEmpty(message = "Chưa chọn câu hỏi nào.")
    private List<String> questionIds;

    private Question.UsageScope usageScope;

    private String collectionId;

    private Boolean clearCollection;

    private Boolean isBank;
}
