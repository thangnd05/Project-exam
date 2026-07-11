package com.project_exam.backend.modules.vocabulary.word.mapper;

import com.project_exam.backend.modules.vocabulary.word.domain.Vocabulary;
import com.project_exam.backend.modules.vocabulary.word.dto.VocabularyResponse;
import org.springframework.stereotype.Component;

@Component
public class VocabularyMapper {

    /**
     * Map entity sang DTO. albumName/albumDesc cần truy DB (album) nên được
     * service resolve và set sau khi gọi mapper này, giữ mapper thuần.
     */
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
