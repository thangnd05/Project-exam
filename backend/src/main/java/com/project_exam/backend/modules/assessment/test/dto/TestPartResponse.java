package com.project_exam.backend.modules.assessment.test.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestPartResponse {
    private String testPartId;
    private String examPartId;
    private String partName; // Tên part lấy từ ExamPart.name
    private List<QuestionGroupResponse> questionGroups; // Chuyển từ List<QuestionResponse> sang Group
}
