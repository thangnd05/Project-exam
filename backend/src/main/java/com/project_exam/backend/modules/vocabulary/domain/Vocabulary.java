package com.project_exam.backend.modules.vocabulary.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vocabulary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vocabulary {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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
