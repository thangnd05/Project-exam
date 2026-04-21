package com.project_exam.backend.dto.request;

import lombok.Data;

@Data
public class VocabularyRequest {

    private String word;
    private String phonetic;
    private String meaning;
    private String example;

    private String albumId;        // chọn album có sẵn

    private String newAlbumName; // nếu tạo album mới
    private String newAlbumDesc;

    private String userId;

    private String voiceUrl;     // audio pronunciation
}