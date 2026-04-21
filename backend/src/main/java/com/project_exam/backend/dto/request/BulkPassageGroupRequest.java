package com.project_exam.backend.dto.request;

import lombok.Data;

import java.util.List;
@Data
public class BulkPassageGroupRequest {

    private String examPartId;
    private String classId;
    private String chapterId;

    private List<PassageQuestionGroup> groups;
}

