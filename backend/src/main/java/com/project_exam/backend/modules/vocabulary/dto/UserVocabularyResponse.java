package com.project_exam.backend.modules.vocabulary.dto;

import com.project_exam.backend.modules.vocabulary.domain.UserVocabulary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserVocabularyResponse {
    private String id;
    private String userId;
    private String vocabId;
    private UserVocabulary.Status status;
    private LocalDateTime lastReviewed;
    private Integer correctCount;
}
