package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import lombok.Data;

import java.util.List;
@Data
public class BulkPassageGroupRequest {

    private String examPartId;
    private String classId;
    private String chapterId;

    private List<PassageQuestionGroupRequest> groups;

    private Question.UsageScope usageScope;
}

