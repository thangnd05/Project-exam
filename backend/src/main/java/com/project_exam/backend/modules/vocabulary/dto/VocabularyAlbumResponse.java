package com.project_exam.backend.modules.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyAlbumResponse {
    private String albumId;
    private String name;
    private String description;
    private String userId;
    private LocalDateTime createdAt;
}
