package com.project_exam.backend.services.LearningVoca;

import com.project_exam.backend.dto.request.PracticeCheckRequest;
import com.project_exam.backend.dto.response.PracticeCheckResponse;
import com.project_exam.backend.dto.response.PracticeQuestionResponse;
import com.project_exam.backend.models.*;
import com.project_exam.backend.repositories.*;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PracticeService {

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private UserVocabularyRepository userVocabularyRepository;

    private final AuthUtils authUtils;

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
    }

    public PracticeCheckResponse checkAnswer(HttpServletRequest request, PracticeCheckRequest req) {
        String userId = authUtils.getUserId(request);
        Vocabulary vocab = vocabularyRepository.findById(req.getVocabId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng"));

        boolean correct = false;

        if ("MULTICHOICE".equals(req.getType())) {
            correct = vocab.getMeaning().equalsIgnoreCase(req.getSelectedOptionText());
        } else if ("LISTENING_EN".equals(req.getType())) {
            boolean en = vocab.getWord().equalsIgnoreCase(req.getUserEnglish());
            boolean vi = vocab.getMeaning().equalsIgnoreCase(req.getUserVietnamese());
            correct = en && vi;
        }

        // ✅ Cập nhật tiến trình học
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

        return new PracticeCheckResponse(
                vocab.getVocabId(),
                correct,
                uv.getStatus().name(),
                uv.getCorrectCount()
        );
    }

}

