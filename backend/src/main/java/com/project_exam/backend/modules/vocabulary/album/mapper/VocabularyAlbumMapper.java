package com.project_exam.backend.modules.vocabulary.album.mapper;

import com.project_exam.backend.modules.vocabulary.album.domain.VocabularyAlbum;
import com.project_exam.backend.modules.vocabulary.album.dto.VocabularyAlbumResponse;
import org.springframework.stereotype.Component;

@Component
public class VocabularyAlbumMapper {

    public VocabularyAlbumResponse toResponse(VocabularyAlbum album) {
        return VocabularyAlbumResponse.builder()
                .albumId(album.getAlbumId())
                .name(album.getName())
                .description(album.getDescription())
                .userId(album.getUserId())
                .createdAt(album.getCreatedAt())
                .build();
    }
}
