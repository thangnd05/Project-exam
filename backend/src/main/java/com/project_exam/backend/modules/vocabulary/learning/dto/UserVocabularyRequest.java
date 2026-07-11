package com.project_exam.backend.modules.vocabulary.learning.dto;

import com.project_exam.backend.modules.vocabulary.learning.domain.UserVocabulary;
import lombok.Data;

@Data
public class UserVocabularyRequest {
    private String vocabId;
    private UserVocabulary.Status status;
}
