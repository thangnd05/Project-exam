package com.project_exam.backend.modules.classroom.chapter.dto;

import lombok.Data;

@Data
public class ChapterRequest {
    private String classId;
    private String title;
    private String description;
}
