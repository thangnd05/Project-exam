package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.*;

@Getter
@Builder
@AllArgsConstructor
public class TagResponse {
    private final String tagId;
    private final String name;
    private final String examTypeId;
    private final String examPartId;
    private final String examPartName;
    private final Integer sortOrder;
    /** Chỉ có ở danh sách tag theo kỳ thi. */
    private final Long resourceCount;
}
