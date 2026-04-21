package com.project_exam.backend.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class AddQuestionsToTestRequest {

    private String testPartId;
    private List<String> questionIds;
}
