package com.project_exam.backend.modules.vocabulary.dto;

import com.project_exam.backend.modules.vocabulary.domain.UserVocabulary;
import lombok.Data;

@Data
public class UserVocabularyRequest {
    private String vocabId;
    private UserVocabulary.Status status;
}
