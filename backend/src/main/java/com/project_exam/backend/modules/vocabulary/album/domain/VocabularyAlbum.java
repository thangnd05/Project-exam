package com.project_exam.backend.modules.vocabulary.album.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "vocabulary_album", indexes = {
    @Index(name = "idx_vocabulary_album_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyAlbum {
    @Id
    @UuidV7
    private String albumId;

    @Column(nullable = false, length = 100)
    private String name;

    private String description;

    @Column(nullable = false)
    private String userId;

    private Instant createdAt = Instant.now();
}
