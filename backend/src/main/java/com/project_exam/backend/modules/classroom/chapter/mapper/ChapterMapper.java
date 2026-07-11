package com.project_exam.backend.modules.classroom.chapter.mapper;

import com.project_exam.backend.modules.classroom.chapter.domain.Chapter;
import com.project_exam.backend.modules.classroom.chapter.dto.ChapterResponse;
import org.springframework.stereotype.Component;

@Component
public class ChapterMapper {

    public ChapterResponse toResponse(Chapter c) {
        return ChapterResponse.builder()
                .chapterId(c.getChapterId())
                .classId(c.getClassId())
                .title(c.getTitle())
                .description(c.getDescription())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
