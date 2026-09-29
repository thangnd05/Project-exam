package com.project_exam.backend.modules.vocabulary.word.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "vocabulary", schema = "vocabulary", indexes = {
    @Index(name = "idx_vocabulary_album_id", columnList = "album_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE vocabulary.vocabulary SET deleted_at = now() WHERE vocab_id = ?")
@SQLRestriction("deleted_at IS NULL")
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
    private String albumId;

    private String voiceUrl;

    private Instant createdAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;

}
