package com.project_exam.backend.modules.vocabulary.word.mapper;

import com.project_exam.backend.modules.vocabulary.word.domain.Vocabulary;
import com.project_exam.backend.modules.vocabulary.word.dto.VocabularyResponse;
import org.springframework.stereotype.Component;

@Component
public class VocabularyMapper {

    public VocabularyResponse toResponse(Vocabulary vocab) {
        return VocabularyResponse.builder()
                .vocabId(vocab.getVocabId())
                .word(vocab.getWord())
                .phonetic(vocab.getPhonetic())
                .meaning(vocab.getMeaning())
                .example(vocab.getExample())
                .albumId(vocab.getAlbumId())
                .voiceUrl(vocab.getVoiceUrl())
                .createdAt(vocab.getCreatedAt())
                .build();
    }
}
