package com.project_exam.backend.dto.request;

import com.project_exam.backend.models.UserVocabulary;
import lombok.Data;

@Data
public class UserVocabularyRequest {
    private String vocabId;
    private UserVocabulary.Status status;
}
