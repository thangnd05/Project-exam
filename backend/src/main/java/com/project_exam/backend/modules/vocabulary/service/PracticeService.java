package com.project_exam.backend.modules.vocabulary.service;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.assessment.attempt.dto.PracticeCheckRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.PracticeCheckResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.PracticeQuestionResponse;
import com.project_exam.backend.modules.users.domain.*;
import com.project_exam.backend.modules.posts.domain.*;
import com.project_exam.backend.modules.assessment.exam.domain.*;
import com.project_exam.backend.modules.assessment.test.domain.*;
import com.project_exam.backend.modules.assessment.attempt.domain.*;
import com.project_exam.backend.modules.vocabulary.domain.*;
import com.project_exam.backend.modules.classroom.domain.*;
import com.project_exam.backend.modules.audit.domain.*;
import com.project_exam.backend.modules.users.repository.*;
import com.project_exam.backend.modules.posts.repository.*;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.repository.*;
import com.project_exam.backend.modules.classroom.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import com.project_exam.backend.modules.gamification.streak.domain.StreakActivityType;
import com.project_exam.backend.modules.gamification.streak.service.StreakService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PracticeService {

    private final VocabularyRepository vocabularyRepository;
    private final UserVocabularyRepository userVocabularyRepository;
    private final AuthUtils authUtils;
    private final StreakService streakService;

    public Optional<PracticeQuestionResponse> generateOneRandomQuestion(HttpServletRequest request, String albumId) {
        String userId = authUtils.getUserId(request);

        // 1️⃣ Lấy các vocab user chưa mastered
        List<String> masteredIds = userVocabularyRepository
                .findVocabIdsByUserIdAndStatus(userId, UserVocabulary.Status.mastered);
        List<Vocabulary> all = vocabularyRepository.findByAlbumId(albumId);
        List<Vocabulary> available = all.stream()
                .filter(v -> !masteredIds.contains(v.getVocabId()))
                .collect(Collectors.toList());

        if (available.isEmpty()) return Optional.empty();

        // 2️⃣ Random vocab
        Vocabulary vocab = available.get(ThreadLocalRandom.current().nextInt(available.size()));

        // 3️⃣ Random loại câu hỏi
        String type = ThreadLocalRandom.current().nextBoolean() ? "MULTICHOICE" : "LISTENING_EN";

        // 4️⃣ MULTICHOICE: tạo 4 đáp án
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

        return Optional.of(new PracticeQuestionResponse(
                vocab.getVocabId(),
                type,
                type.equals("MULTICHOICE") ?
                        "Chọn nghĩa đúng của từ: " + vocab.getWord() :
                        "Nghe và nhập lại từ bạn nghe được",
                vocab.getVoiceUrl(),
                vocab.getWord(),
                vocab.getMeaning(),
                options
        ));
    }

        public void markWordAsKnown(HttpServletRequest httpRequest, String vocabId) {
        String currentUserId = authUtils.getUserId(httpRequest);

        UserVocabulary uv = userVocabularyRepository.findByUserIdAndVocabId(currentUserId, vocabId)
                .orElse(new UserVocabulary(currentUserId, vocabId));

        uv.setStatus(UserVocabulary.Status.mastered);
        uv.setCorrectCount(5);
        uv.setLastReviewed(LocalDateTime.now());

        userVocabularyRepository.save(uv);

        // 🔥 Học từ vựng -> ghi nhận streak (side-effect, không phá luồng)
        try {
            streakService.recordActivity(currentUserId, StreakActivityType.VOCAB_PRACTICE);
        } catch (Exception ignored) {
        }
    }

    public PracticeCheckResponse checkAnswer(HttpServletRequest request, PracticeCheckRequest req) {
        String userId = authUtils.getUserId(request);
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

        //  Cập nhật tiến trình học
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

        uv.setLastReviewed(LocalDateTime.now());
        userVocabularyRepository.save(uv);

        // 🔥 Luyện từ vựng -> ghi nhận streak (side-effect, không phá luồng)
        try {
            streakService.recordActivity(userId, StreakActivityType.VOCAB_PRACTICE);
        } catch (Exception ignored) {
        }

        return new PracticeCheckResponse(
                vocab.getVocabId(),
                correct,
                uv.getStatus().name(),
                uv.getCorrectCount()
        );
    }

}

