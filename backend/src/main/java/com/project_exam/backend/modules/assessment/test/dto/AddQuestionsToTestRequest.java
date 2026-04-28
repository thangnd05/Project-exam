package com.project_exam.backend.modules.assessment.test.dto;

import lombok.Data;
import java.util.List;

@Data
public class AddQuestionsToTestRequest {

    private String testPartId;
    private List<String> questionIds;
}
