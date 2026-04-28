package com.project_exam.backend.modules.vocabulary.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VocabularyAlbumResponse {
    private String albumId;
    private String name;
    private String description;
    private String userId;
    private LocalDateTime createdAt;
}
