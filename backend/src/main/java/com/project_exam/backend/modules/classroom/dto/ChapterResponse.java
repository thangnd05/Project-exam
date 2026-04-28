package com.project_exam.backend.modules.classroom.dto;

import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@Data
public class ChapterResponse {

    private String chapterId;
    private String classId;
    private String title;
    private String description;
    private LocalDateTime createdAt;
}

