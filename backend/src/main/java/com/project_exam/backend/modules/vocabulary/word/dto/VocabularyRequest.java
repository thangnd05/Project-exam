package com.project_exam.backend.modules.vocabulary.word.dto;

import lombok.Data;

@Data
public class VocabularyRequest {

    private String word;
    private String phonetic;
    private String meaning;
    private String example;

    private String albumId;

    private String newAlbumName;
    private String newAlbumDesc;

    private String userId;

    private String voiceUrl;
}
