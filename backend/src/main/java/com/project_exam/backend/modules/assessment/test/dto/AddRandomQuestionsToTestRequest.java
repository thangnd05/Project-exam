package com.project_exam.backend.modules.assessment.test.dto;

import lombok.Data;

@Data
public class AddRandomQuestionsToTestRequest {

    private String testPartId;

    private Integer count;

    private String classId;

    private String chapterId;

    private Boolean isSequential;

    private Integer fromIndex;

    private Integer toIndex;

    private String bank;

    private String collectionId;
}
