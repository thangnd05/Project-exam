package com.project_exam.backend.modules.classroom.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chapters", indexes = {
    @Index(name = "idx_chapters_class_id", columnList = "class_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {

    @Id
    @UuidV7
    @Column(name = "chapter_id")
    private String chapterId;

    @Column(name = "class_id", nullable = false)
    private String classId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
