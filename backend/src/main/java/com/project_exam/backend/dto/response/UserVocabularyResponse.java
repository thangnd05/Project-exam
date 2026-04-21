package com.project_exam.backend.dto.response;

import com.project_exam.backend.models.UserVocabulary;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserVocabularyResponse {
    private String id;
    private String userId;
    private String vocabId;
    private UserVocabulary.Status status;
    private LocalDateTime lastReviewed;
    private Integer correctCount;
}
