package com.project_exam.backend.modules.classroom.chapter.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "chapters", schema = "classroom", indexes = {
    @Index(name = "idx_chapters_class_id", columnList = "class_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE classroom.chapters SET deleted_at = now() WHERE chapter_id = ?")
@SQLRestriction("deleted_at IS NULL")
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
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
