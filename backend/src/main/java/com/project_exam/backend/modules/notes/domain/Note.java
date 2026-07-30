package com.project_exam.backend.modules.notes.domain;

import com.project_exam.backend.infrastructure.persistence.UuidV7;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Một ghi chú trong sổ tay cá nhân của user. */
@Entity
@Table(name = "notes", indexes = {
    @Index(name = "idx_notes_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Note {

    @Id
    @UuidV7
    private String noteId;

    @Column(nullable = false)
    private String userId; // FK -> users.user_id

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Note(String userId, String title, String content) {
        this.userId = userId;
        this.title = title;
        this.content = content;
    }

    @PreUpdate
    void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
