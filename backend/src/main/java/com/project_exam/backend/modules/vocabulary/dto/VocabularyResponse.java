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

