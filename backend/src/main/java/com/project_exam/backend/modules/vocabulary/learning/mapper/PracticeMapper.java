package com.project_exam.backend.modules.vocabulary.learning.mapper;

import com.project_exam.backend.modules.assessment.attempt.dto.PracticeCheckResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.PracticeQuestionResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PracticeMapper {

    /**
     * type/questionText/options được tính ở service (random, distractors...) nên
     * truyền vào qua tham số; mapper chỉ dựng DTO.
     */
    public PracticeQuestionResponse toQuestionResponse(
            String vocabId,
            String type,
            String questionText,
            String voiceUrl,
            String word,
            String meaning,
            List<String> options
    ) {
        return PracticeQuestionResponse.builder()
                .vocabId(vocabId)
                .type(type)
                .questionText(questionText)
                .voiceUrl(voiceUrl)
                .word(word)
                .meaning(meaning)
                .options(options)
                .build();
    }

    public PracticeCheckResponse toCheckResponse(
            String vocabId,
            boolean correct,
            String status,
            int correctCount
    ) {
        return PracticeCheckResponse.builder()
                .vocabId(vocabId)
                .correct(correct)
                .status(status)
                .correctCount(correctCount)
                .build();
    }
}
