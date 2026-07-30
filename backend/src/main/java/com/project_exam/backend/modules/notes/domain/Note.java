package com.project_exam.backend.modules.notes.domain;

import com.project_exam.backend.infrastructure.persistence.UuidV7;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

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
    private String userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public Note(String userId, String title, String content) {
        this.userId = userId;
        this.title = title;
        this.content = content;
    }

    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }
}
