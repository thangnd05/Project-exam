package com.project_exam.backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class VocabularyResponse {
    private String vocabId;
    private String word;
    private String phonetic;
    private String meaning;
    private String example;

    private String albumId;
    private String albumName;
    private String albumDesc;   // 👉 thêm để biết mô tả album (optional)

    private String voiceUrl;   // 👈 thêm field này
    private LocalDateTime createdAt;
}

