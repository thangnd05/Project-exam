package com.project_exam.backend.modules.vocabulary.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vocabulary", indexes = {
    @Index(name = "idx_vocabulary_album_id", columnList = "album_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vocabulary {
    @Id
    @UuidV7
    private String vocabId;

    @Column(nullable = false, length = 100)
    private String word;

    private String phonetic;

    @Column(nullable = false, length = 255)
    private String meaning;

    private String example;

    @Column(nullable = false)
    private String albumId; // FK -> vocabulary_album.album_id

    private String voiceUrl; // URL audio pronunciation

    private LocalDateTime createdAt = LocalDateTime.now();

}
