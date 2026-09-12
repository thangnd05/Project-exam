package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class BulkUpdateQuestionsResponse {

    private final int updatedCount;

    private final List<String> missingQuestionIds;
}
