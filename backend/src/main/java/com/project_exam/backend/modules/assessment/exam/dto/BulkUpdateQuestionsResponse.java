package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class BulkUpdateQuestionsResponse {

    /** Số câu thực sự được ghi. */
    private final int updatedCount;

    /** Id gửi lên nhưng không tìm thấy trong DB (đã bị xoá ở tab khác chẳng hạn). */
    private final List<String> missingQuestionIds;
}
