package com.project_exam.backend.dto.request;

import lombok.Data;

@Data
public class ChapterRequest {
    private String classId;
    private String title;
    private String description;
}
