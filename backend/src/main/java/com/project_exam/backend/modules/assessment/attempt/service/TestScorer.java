package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.domain.ScoringConversion;
import com.project_exam.backend.modules.assessment.exam.repository.AnswerRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ScoringConversionRepository;
import com.project_exam.backend.modules.assessment.exam.util.AnswerGradingUtil;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;


@Component
@RequiredArgsConstructor
public class TestScorer {
    /** Điểm sàn TOEIC mỗi skill — fallback khi DB thiếu dòng quy đổi trong scoring_conversions. */
    private static final int TOEIC_MIN_SKILL_SCORE = 5;

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ExamPartRepository examPartRepository;
    private final ScoringConversionRepository scoringConversionRepository;

    /**
     * Điểm cho bài FULL TEST (không phải practice): chọn thuật toán theo scoringMethod của ExamType.
     * Gộp phần dispatch từng bị lặp ở submitTest & submitGuestTest.
     */
    public int scoreFullTest(List<UserAnswer> userAnswers, Test test, ExamType examType, int totalQuestionsInTest) {
        String scoringMethod = examType.getScoringMethod() != null
                ? examType.getScoringMethod().toLowerCase() : "default";
        if ("toeic_scale".equalsIgnoreCase(scoringMethod)) {
            return scoreToeicOptimal(userAnswers, test, examType);
        }
        if ("aws_scale".equalsIgnoreCase(scoringMethod)) {
            return scoreAwsScale(userAnswers, totalQuestionsInTest);
        }
        return scoreDefault(userAnswers, totalQuestionsInTest);
    }

    public int scoreToeicForSkills(List<UserAnswer> userAnswers, ExamType examType, Set<String> skillIds) {
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);
        List<String> allQuestionIds = uniqueAnswers.stream().map(UserAnswer::getQuestionId).toList();

        Map<String, Question> questionMap = questionRepository.findAllById(allQuestionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));
        Map<String, List<Answer>> correctAnswersMap = answerRepository.findByQuestionIdInAndIsCorrectTrue(allQuestionIds)
                .stream().collect(Collectors.groupingBy(Answer::getQuestionId));
        Set<String> examPartIds = questionMap.values().stream()
                .map(Question::getExamPartId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<String, String> examPartToSkillId = examPartRepository.findAllById(examPartIds).stream()
                .filter(ep -> ep.getSkillId() != null)
                .collect(Collectors.toMap(ExamPart::getExamPartId, ExamPart::getSkillId));

        Map<String, Integer> skillCorrectCount = new HashMap<>();
        for (UserAnswer ua : uniqueAnswers) {
            Question question = questionMap.get(ua.getQuestionId());
            List<Answer> correctAnswers = correctAnswersMap.get(ua.getQuestionId());
            if (question == null || correctAnswers == null || correctAnswers.isEmpty()) continue;

            String skillId = question.getExamPartId() != null
                    ? examPartToSkillId.get(question.getExamPartId()) : null;
            if (skillId == null || !skillIds.contains(skillId)) continue;

            boolean isCorrect = AnswerGradingUtil.isCorrect(question.getQuestionType(),
                    ua.getSelectedAnswerId(), ua.getSelectedAnswerIds(),
                    ua.getAnswerText(), correctAnswers);
            if (isCorrect) skillCorrectCount.merge(skillId, 1, Integer::sum);
        }

        int totalScore = 0;
        for (String skillId : skillIds) {
            int numCorrect = skillCorrectCount.getOrDefault(skillId, 0);
            totalScore += convertSkillScore(examType.getExamTypeId(), skillId, numCorrect);
        }
        return totalScore;
    }

    public int scoreDefault(List<UserAnswer> userAnswers, int totalQuestionsInTest) {
        if (userAnswers.isEmpty()) {
            return 0;
        }
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);
        int totalQuestions = totalQuestionsInTest > 0 ? totalQuestionsInTest
                : (int) uniqueAnswers.stream().map(UserAnswer::getQuestionId).distinct().count();
        if (totalQuestions == 0) {
            return 0;
        }
        int correctCount = countCorrectAnswers(uniqueAnswers);
        // Tính điểm theo thang 100: (số câu đúng / tổng số câu) * 100
        return (int) Math.round((double) correctCount / totalQuestions * 100);
    }

    /**
     * Thang điểm kiểu AWS (scaled 100–1000): Score = 100 + (số câu đúng / tổng câu) * 900.
     * Tổng câu = số câu thực tế của đề (vd AWS = 65). Kết quả kẹp trong [100, 1000].
     */
    public int scoreAwsScale(List<UserAnswer> userAnswers, int totalQuestionsInTest) {
        if (userAnswers.isEmpty()) {
            return 100;
        }
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);
        int totalQuestions = totalQuestionsInTest > 0 ? totalQuestionsInTest
                : (int) uniqueAnswers.stream().map(UserAnswer::getQuestionId).distinct().count();
        if (totalQuestions == 0) {
            return 100;
        }
        int correctCount = countCorrectAnswers(uniqueAnswers);
        int score = 100 + (int) Math.round((double) correctCount / totalQuestions * 900);
        return Math.max(100, Math.min(1000, score));
    }

    /** Đếm số câu đúng (MCQ/MSQ/FILL) trong danh sách đáp án (đã dedup). */
    private int countCorrectAnswers(List<UserAnswer> uniqueAnswers) {
        Set<String> questionIds = uniqueAnswers.stream()
                .map(UserAnswer::getQuestionId)
                .collect(Collectors.toSet());
        if (questionIds.isEmpty()) return 0;

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));
        Map<String, List<Answer>> correctAnswersMap = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        int correctCount = 0;
        for (UserAnswer userAnswer : uniqueAnswers) {
            Question question = questionMap.get(userAnswer.getQuestionId());
            List<Answer> correctAnswers = correctAnswersMap.get(userAnswer.getQuestionId());
            if (question == null || correctAnswers == null || correctAnswers.isEmpty()) {
                continue;
            }
            if (AnswerGradingUtil.isCorrect(question.getQuestionType(),
                    userAnswer.getSelectedAnswerId(), userAnswer.getSelectedAnswerIds(),
                    userAnswer.getAnswerText(), correctAnswers)) {
                correctCount++;
            }
        }
        return correctCount;
    }

    public int scoreToeicOptimal(List<UserAnswer> userAnswers, Test test, ExamType examType) {
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);

        // 1. Lấy thông tin Question đầy đủ
        List<String> allQuestionIds = uniqueAnswers.stream().map(UserAnswer::getQuestionId).toList();
        List<Question> questions = questionRepository.findAllById(allQuestionIds);
        Map<String, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        // 2. Lấy thông tin đáp án đúng đầy đủ
        Map<String, List<Answer>> correctAnswersMap = answerRepository.findByQuestionIdInAndIsCorrectTrue(allQuestionIds)
                .stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        // 3. Lấy thông tin ExamPart và Skill
        Set<String> allExamPartIds = questions.stream().map(Question::getExamPartId).collect(Collectors.toSet());
        List<ExamPart> examParts = examPartRepository.findAllById(allExamPartIds);
        Map<String, String> examPartToSkillIdMap = examParts.stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, ExamPart::getSkillId));

        Map<String, Integer> skillCorrectCount = new HashMap<>();

        for (UserAnswer ua : uniqueAnswers) {
            String questionId = ua.getQuestionId();
            Question question = questionMap.get(questionId);
            List<Answer> correctAnswers = correctAnswersMap.get(questionId);

            if (question == null || correctAnswers == null || correctAnswers.isEmpty()) {
                continue;
            }

            // 4. Logic kiểm tra đúng/sai (MCQ/MSQ/FILL) qua helper dùng chung
            boolean isCorrect = AnswerGradingUtil.isCorrect(question.getQuestionType(),
                    ua.getSelectedAnswerId(), ua.getSelectedAnswerIds(),
                    ua.getAnswerText(), correctAnswers);

            String examPartId = question.getExamPartId();
            String skillId = examPartId != null ? examPartToSkillIdMap.get(examPartId) : null;

            if (isCorrect && skillId != null) {
                skillCorrectCount.merge(skillId, 1, Integer::sum);
            }
        }

        // 5. Quy đổi điểm
        int totalScore = 0;
        for (Map.Entry<String, Integer> entry : skillCorrectCount.entrySet()) {
            totalScore += convertSkillScore(examType.getExamTypeId(), entry.getKey(), entry.getValue());
        }

        Set<String> allSkillIdsInTest = examParts.stream().map(ExamPart::getSkillId).filter(Objects::nonNull).collect(Collectors.toSet());
        for (String skillId : allSkillIdsInTest) {
            if (!skillCorrectCount.containsKey(skillId)) {
                totalScore += convertSkillScore(examType.getExamTypeId(), skillId, 0);
            }
        }
        return totalScore;
    }

    /**
     * Tra bảng scoring_conversions để quy đổi số câu đúng → điểm skill.
     * Thiếu dòng quy đổi (seed thiếu/lệch số câu) thì fallback về điểm sàn TOEIC
     * thay vì vỡ luồng nộp bài.
     */
    private int convertSkillScore(String examTypeId, String skillId, int numCorrect) {
        return scoringConversionRepository
                .findByExamTypeIdAndSkillIdAndNumCorrect(examTypeId, skillId, numCorrect)
                .map(ScoringConversion::getConvertedScore)
                .orElse(TOEIC_MIN_SKILL_SCORE);
    }

    private List<UserAnswer> deduplicateByQuestionId(List<UserAnswer> userAnswers) {
        if (userAnswers == null || userAnswers.isEmpty()) {
            return List.of();
        }
        Map<String, UserAnswer> uniqueByQuestionId = new LinkedHashMap<>();
        for (UserAnswer userAnswer : userAnswers) {
            if (userAnswer.getQuestionId() == null) {
                continue;
            }
            uniqueByQuestionId.putIfAbsent(userAnswer.getQuestionId(), userAnswer);
        }
        return new ArrayList<>(uniqueByQuestionId.values());
    }
}
