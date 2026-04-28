package com.project_exam.backend.modules.vocabulary.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vocabulary_album")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyAlbum {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String albumId;

    @Column(nullable = false, length = 100)
    private String name;

    private String description;

    @Column(nullable = false)
    private String userId; // FK -> users.user_id

    private LocalDateTime createdAt = LocalDateTime.now();
}
