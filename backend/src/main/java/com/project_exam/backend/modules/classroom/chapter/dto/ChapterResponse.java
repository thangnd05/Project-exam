package com.project_exam.backend.modules.classroom.chapter.dto;

import lombok.*;

import java.time.LocalDateTime;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ChapterResponse {

    private String chapterId;
    private String classId;
    private String title;
    private String description;
    private LocalDateTime createdAt;
}

