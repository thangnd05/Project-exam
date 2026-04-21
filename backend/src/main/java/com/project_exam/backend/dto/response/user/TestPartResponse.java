package com.project_exam.backend.dto.response.user;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class TestPartResponse {
    private String testPartId;
    private String examPartId;
    private List<QuestionGroupResponse> questionGroups; // Chuyển từ List<QuestionResponse> sang Group

    public TestPartResponse(String testPartId, String examPartId, List<QuestionGroupResponse> questionGroups) {
        this.testPartId = testPartId;
        this.examPartId = examPartId;
        this.questionGroups = questionGroups;
    }
}
