package com.project_exam.backend.modules.vocabulary.learning.service;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.attempt.dto.PracticeCheckRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.PracticeCheckResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.PracticeQuestionResponse;
import com.project_exam.backend.modules.users.user.domain.*;
import com.project_exam.backend.modules.users.rbac.domain.*;
import com.project_exam.backend.modules.posts.post.domain.*;
import com.project_exam.backend.modules.posts.comment.domain.*;
import com.project_exam.backend.modules.posts.category.domain.*;
import com.project_exam.backend.modules.posts.react.domain.*;
import com.project_exam.backend.modules.posts.saved.domain.*;
import com.project_exam.backend.modules.assessment.exam.domain.*;
import com.project_exam.backend.modules.assessment.test.domain.*;
import com.project_exam.backend.modules.assessment.attempt.domain.*;
import com.project_exam.backend.modules.vocabulary.album.domain.*;
import com.project_exam.backend.modules.vocabulary.word.domain.*;
import com.project_exam.backend.modules.vocabulary.learning.domain.*;
import com.project_exam.backend.modules.vocabulary.lookup.domain.*;
import com.project_exam.backend.modules.vocabulary.learning.mapper.PracticeMapper;
import com.project_exam.backend.modules.classroom.clazz.domain.*;
import com.project_exam.backend.modules.classroom.chapter.domain.*;
import com.project_exam.backend.modules.classroom.member.domain.*;
import com.project_exam.backend.modules.audit.domain.*;
import com.project_exam.backend.modules.users.user.repository.*;
import com.project_exam.backend.modules.users.rbac.repository.*;
import com.project_exam.backend.modules.posts.post.repository.*;
import com.project_exam.backend.modules.posts.comment.repository.*;
import com.project_exam.backend.modules.posts.category.repository.*;
import com.project_exam.backend.modules.posts.react.repository.*;
import com.project_exam.backend.modules.posts.saved.repository.*;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.album.repository.*;
import com.project_exam.backend.modules.vocabulary.word.repository.*;
import com.project_exam.backend.modules.vocabulary.learning.repository.*;
import com.project_exam.backend.modules.classroom.clazz.repository.*;
import com.project_exam.backend.modules.classroom.chapter.repository.*;
import com.project_exam.backend.modules.classroom.member.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import com.project_exam.backend.modules.gamification.streak.domain.StreakActivityType;
import com.project_exam.backend.modules.gamification.streak.service.StreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PracticeService {

    private final VocabularyRepository vocabularyRepository;
    private final UserVocabularyRepository userVocabularyRepository;
    private final StreakService streakService;
    private final PracticeMapper practiceMapper;

    public Optional<PracticeQuestionResponse> generateOneRandomQuestion(String userId, String albumId) {
        List<String> masteredIds = userVocabularyRepository
                .findVocabIdsByUserIdAndStatus(userId, UserVocabulary.Status.mastered);
        List<Vocabulary> all = vocabularyRepository.findByAlbumId(albumId);
        List<Vocabulary> available = all.stream()
                .filter(v -> !masteredIds.contains(v.getVocabId()))
                .collect(Collectors.toList());

        if (available.isEmpty()) return Optional.empty();

        Vocabulary vocab = available.get(ThreadLocalRandom.current().nextInt(available.size()));

        String type = ThreadLocalRandom.current().nextBoolean() ? "MULTICHOICE" : "LISTENING_EN";

        List<String> options = null;
        if (type.equals("MULTICHOICE")) {
            List<Vocabulary> distractors = all.stream()
                    .filter(v -> !v.getVocabId().equals(vocab.getVocabId()))
                    .collect(Collectors.toList());
            Collections.shuffle(distractors);
            List<String> choices = distractors.stream().limit(3)
                    .map(Vocabulary::getMeaning)
                    .collect(Collectors.toList());
            choices.add(vocab.getMeaning());
            Collections.shuffle(choices);
            options = choices;
        }

        String questionText = type.equals("MULTICHOICE") ?
                "Chọn nghĩa đúng của từ: " + vocab.getWord() :
                "Nghe và nhập lại từ bạn nghe được";

        return Optional.of(practiceMapper.toQuestionResponse(
                vocab.getVocabId(),
                type,
                questionText,
                vocab.getVoiceUrl(),
                vocab.getWord(),
                vocab.getMeaning(),
                options
        ));
    }

    public void markWordAsKnown(String userId, String vocabId) {
        UserVocabulary uv = userVocabularyRepository.findByUserIdAndVocabId(userId, vocabId)
                .orElse(new UserVocabulary(userId, vocabId));

        uv.setStatus(UserVocabulary.Status.mastered);
        uv.setCorrectCount(5);
        uv.setLastReviewed(Instant.now());

        userVocabularyRepository.save(uv);

        try {
            streakService.recordActivity(userId, StreakActivityType.VOCAB_PRACTICE);
        } catch (Exception ignored) {
        }
    }

    public PracticeCheckResponse checkAnswer(String userId, PracticeCheckRequest req) {
        Vocabulary vocab = vocabularyRepository.findById(req.getVocabId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy từ vựng"));

        boolean correct = false;

        if ("MULTICHOICE".equals(req.getType())) {
            correct = vocab.getMeaning().equalsIgnoreCase(req.getSelectedOptionText());
        } else if ("LISTENING_EN".equals(req.getType())) {
            boolean en = vocab.getWord().equalsIgnoreCase(req.getUserEnglish());
            boolean vi = vocab.getMeaning().equalsIgnoreCase(req.getUserVietnamese());
            correct = en && vi;
        }

        UserVocabulary uv = userVocabularyRepository
                .findByUserIdAndVocabId(userId, vocab.getVocabId())
                .orElse(new UserVocabulary(userId, vocab.getVocabId()));

        if (correct) {
            uv.setCorrectCount(uv.getCorrectCount() + 1);
            if (uv.getCorrectCount() >= 5) uv.setStatus(UserVocabulary.Status.mastered);
        } else {
            uv.setCorrectCount(0);
            uv.setStatus(UserVocabulary.Status.learning);
        }

        uv.setLastReviewed(Instant.now());
        userVocabularyRepository.save(uv);

        try {
            streakService.recordActivity(userId, StreakActivityType.VOCAB_PRACTICE);
        } catch (Exception ignored) {
        }

        return practiceMapper.toCheckResponse(
                vocab.getVocabId(),
                correct,
                uv.getStatus().name(),
                uv.getCorrectCount()
        );
    }

}

