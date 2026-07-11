package com.project_exam.backend.modules.vocabulary.learning.mapper;

import com.project_exam.backend.modules.vocabulary.learning.domain.UserVocabulary;
import com.project_exam.backend.modules.vocabulary.learning.dto.UserVocabularyResponse;
import org.springframework.stereotype.Component;

@Component
public class UserVocabularyMapper {

    public UserVocabularyResponse toResponse(UserVocabulary uv) {
        return UserVocabularyResponse.builder()
                .id(uv.getId())
                .userId(uv.getUserId())
                .vocabId(uv.getVocabId())
                .status(uv.getStatus())
                .lastReviewed(uv.getLastReviewed())
                .correctCount(uv.getCorrectCount())
                .build();
    }
}
