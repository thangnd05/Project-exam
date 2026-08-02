package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.dto.*;
import com.project_exam.backend.modules.assessment.attempt.repository.UserAnswerRepository;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.exam.domain.*;
import com.project_exam.backend.modules.assessment.attempt.util.ReadinessThresholds;
import com.project_exam.backend.modules.assessment.exam.util.AnswerGradingUtil;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import com.project_exam.backend.modules.assessment.test.repository.TestPartRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestQuestionRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.assessment.target.repository.UserTargetRepository;
import com.project_exam.backend.modules.assessment.target.repository.UserTargetPartRepository;
import com.project_exam.backend.modules.assessment.target.domain.UserTarget;
import com.project_exam.backend.modules.assessment.target.domain.UserTargetPart;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnhancedResultService {

    private final UserTestRepository userTestRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ExamPartRepository examPartRepository;
    private final SkillRepository skillRepository;
    private final TestRepository testRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final ExamCategoryRepository examCategoryRepository;
    private final QuestionTagRepository questionTagRepository;
    private final TagRepository tagRepository;
    private final UserTargetRepository userTargetRepository;
    private final UserTargetPartRepository userTargetPartRepository;
    private final ExamTypeRepository examTypeRepository;

    public EnhancedResultDto getEnhancedResult(String userTestId, String currentUserId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));
        if (!Objects.equals(userTest.getUserId(), currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền xem kết quả bài thi này");
        }
        return buildEnhancedResult(userTest);
    }

    public EnhancedResultDto getGuestEnhancedResult(String userTestId, String guestSessionId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));
        if (userTest.getGuestSessionId() == null
                || !userTest.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }
        return buildEnhancedResult(userTest);
    }

    private EnhancedResultDto buildEnhancedResult(UserTest userTest) {
        log.info("Building enhanced result for userTestId={}, status={}", userTest.getUserTestId(), userTest.getStatus());
        if (userTest.getStatus() != UserTest.Status.COMPLETED) {
            return EnhancedResultDto.builder()
                    .correct(0).wrong(0).total(0).totalScore(0L)
                    .partBreakdown(List.of())
                    .build();
        }

        Test test = testRepository.findById(userTest.getTestId())
                .orElseThrow(() -> new NotFoundException("Test not found"));

        String examTypeName = test.getExamTypeId() != null
                ? examTypeRepository.findById(test.getExamTypeId()).map(ExamType::getName).orElse(null)
                : null;

        String examCategoryCode = null;
        if (test.getExamCategoryId() != null) {
            examCategoryCode = examCategoryRepository.findById(test.getExamCategoryId())
                    .map(ExamCategory::getCode)
                    .orElse(null);
        }

        Set<String> allTestQuestionIds = getAnalyzedQuestionIds(userTest);
        long totalQuestions = allTestQuestionIds.size();

        if (allTestQuestionIds.isEmpty()) {
            return EnhancedResultDto.builder()
                    .correct(0).wrong(0).total(0).totalScore(userTest.getTotalScore() != null ? (long) userTest.getTotalScore() : 0L)
                    .partBreakdown(List.of())
                    .build();
        }

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTest.getUserTestId());
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);

        Map<String, UserAnswer> answeredMap = uniqueAnswers.stream()
                .collect(Collectors.toMap(UserAnswer::getQuestionId, ua -> ua, (a1, a2) -> a1));

        Map<String, Question> questionMap = questionRepository.findAllById(allTestQuestionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q, (q1, q2) -> q1));

        Map<String, List<Answer>> correctAnswersMap = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(allTestQuestionIds)).stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        Map<String, Boolean> correctnessMap = new HashMap<>();
        long totalCorrect = 0;
        for (String qId : allTestQuestionIds) {
            Question question = questionMap.get(qId);
            List<Answer> correctAnswers = correctAnswersMap.get(qId);
            UserAnswer ua = answeredMap.get(qId);

            if (question == null) continue;

            boolean isCorrect = false;
            if (ua != null && correctAnswers != null && !correctAnswers.isEmpty()) {
                isCorrect = checkCorrectness(ua, question, correctAnswers);
            }

            correctnessMap.put(qId, isCorrect);
            if (isCorrect) totalCorrect++;
        }

        long normalizedCorrect = Math.min(totalCorrect, totalQuestions);
        long totalWrong = totalQuestions - normalizedCorrect;

        Map<String, String> statusMap = new HashMap<>();
        for (String qId : allTestQuestionIds) {
            UserAnswer ua = answeredMap.get(qId);
            boolean answered = ua != null
                    && (ua.getSelectedAnswerId() != null
                        || (ua.getAnswerText() != null && !ua.getAnswerText().isBlank()));
            if (!answered) {
                statusMap.put(qId, "skipped");
            } else {
                statusMap.put(qId, Boolean.TRUE.equals(correctnessMap.get(qId)) ? "correct" : "wrong");
            }
        }
        Map<String, Integer> questionNumberMap = buildQuestionNumberMap(userTest.getTestId());

        Set<String> examPartIds = questionMap.values().stream()
                .map(Question::getExamPartId)
                .collect(Collectors.toSet());

        Map<String, ExamPart> examPartMap = examPartRepository.findAllById(examPartIds).stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, ep -> ep));

        Set<String> skillIds = examPartMap.values().stream()
                .map(ExamPart::getSkillId)
                .filter(Objects::nonNull)
                .filter(id -> !id.isBlank())
                .collect(Collectors.toSet());

        Map<String, Skill> skillMap = skillRepository.findAllById(skillIds).stream()
                .collect(Collectors.toMap(Skill::getSkillId, s -> s));

        List<QuestionTag> allQuestionTags = allTestQuestionIds.isEmpty()
                ? List.of()
                : questionTagRepository.findByQuestionIdIn(allTestQuestionIds);

        Map<String, List<QuestionTag>> tagsByQuestion = allQuestionTags.stream()
                .collect(Collectors.groupingBy(QuestionTag::getQuestionId));

        Set<String> allTagIds = allQuestionTags.stream()
                .map(QuestionTag::getTagId)
                .collect(Collectors.toSet());

        Map<String, Tag> tagMap = allTagIds.isEmpty()
                ? Map.of()
                : tagRepository.findAllById(allTagIds).stream()
                .collect(Collectors.toMap(Tag::getTagId, t -> t));

        Optional<UserTarget> userTargetOpt = test.getExamTypeId() != null ?
                userTargetRepository.findByUserIdAndExamTypeId(userTest.getUserId(), test.getExamTypeId()) :
                Optional.empty();

        Map<String, Integer> targetParts = new HashMap<>();
        if (userTargetOpt.isPresent()) {
            List<UserTargetPart> targetPartEntities = userTargetPartRepository.findByUserTargetId(userTargetOpt.get().getUserTargetId());
            for (UserTargetPart p : targetPartEntities) {
                targetParts.put(p.getExamPartId(), p.getCustomPercentage());
            }
        }

        List<PartBreakdownDto> partBreakdown = buildPartBreakdown(
                questionMap, correctnessMap, statusMap, questionNumberMap,
                examPartMap, skillMap, tagsByQuestion, tagMap, targetParts, examTypeName);

        double overallPercentage = totalQuestions > 0
                ? (double) normalizedCorrect / totalQuestions * 100 : 0;
        int readinessScore = calculateReadinessScore(partBreakdown, overallPercentage);
        String readinessLevel = ReadinessThresholds.levelFromScore(readinessScore);

        Integer percentile = calculatePercentile(userTest.getTestId(), userTest.getTotalScore());

        int percentage = (int) Math.round(overallPercentage);
        boolean isQuickChallenge = "QUICK_CHALLENGE".equals(examCategoryCode);
        boolean hasTarget = userTargetOpt.isPresent();
        Integer targetScore = userTargetOpt.map(UserTarget::getTargetScore).orElse(null);
        Long totalScoreVal = isQuickChallenge ? null
                : (userTest.getTotalScore() != null ? (long) userTest.getTotalScore() : 0L);

        Boolean isTargetMetResult = null;
        if (hasTarget && targetScore != null && totalScoreVal != null) {
            isTargetMetResult = totalScoreVal >= targetScore;
        }

        return EnhancedResultDto.builder()
                .correct(normalizedCorrect)
                .wrong(totalWrong)
                .total(totalQuestions)
                .totalScore(totalScoreVal)
                .examCategoryCode(examCategoryCode)
                .examTypeId(test.getExamTypeId())
                .hasTarget(hasTarget)
                .isTargetMet(isTargetMetResult)
                .targetScore(targetScore)
                .percentage(percentage)
                .partBreakdown(partBreakdown)
                .readinessScore(readinessScore)
                .readinessLevel(readinessLevel)
                .percentile(percentile)
                .build();
    }

    private boolean checkCorrectness(UserAnswer ua, Question question, List<Answer> correctAnswers) {
        return AnswerGradingUtil.isCorrect(question.getQuestionType(),
                ua.getSelectedAnswerId(), ua.getSelectedAnswerIds(),
                ua.getAnswerText(), correctAnswers);
    }

    private String resolveSkillName(Skill skill, String examTypeName) {
        if (skill != null) {
            String name = skill.getName();
            if (name != null && !name.isBlank()) {
                return name;
            }
        }
        if (examTypeName != null && !examTypeName.isBlank()) {
            return examTypeName;
        }
        return "Chung";
    }

    private List<PartBreakdownDto> buildPartBreakdown(
            Map<String, Question> questionMap,
            Map<String, Boolean> correctnessMap,
            Map<String, String> statusMap,
            Map<String, Integer> questionNumberMap,
            Map<String, ExamPart> examPartMap,
            Map<String, Skill> skillMap,
            Map<String, List<QuestionTag>> tagsByQuestion,
            Map<String, Tag> tagMap,
            Map<String, Integer> targetParts,
            String examTypeName) {

        Map<String, List<String>> questionsByPart = new HashMap<>();
        for (Map.Entry<String, Question> entry : questionMap.entrySet()) {
            String qId = entry.getKey();
            String partId = entry.getValue().getExamPartId();
            questionsByPart.computeIfAbsent(partId, k -> new ArrayList<>()).add(qId);
        }

        List<PartBreakdownDto> parts = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : questionsByPart.entrySet()) {
            String partId = entry.getKey();
            List<String> qIds = entry.getValue();
            ExamPart examPart = examPartMap.get(partId);
            if (examPart == null) continue;

            Skill skill = skillMap.get(examPart.getSkillId());

            int correct = 0, wrong = 0;
            List<String> wrongQuestionIds = new ArrayList<>();

            for (String qId : qIds) {
                Boolean isCorrect = correctnessMap.get(qId);
                if (isCorrect != null && isCorrect) {
                    correct++;
                } else {
                    wrong++;
                    wrongQuestionIds.add(qId);
                }
            }

            int total = correct + wrong;
            double percentage = total > 0 ? (double) correct / total * 100 : 0;
            double percentageRounded = Math.round(percentage * 10.0) / 10.0;

            Double targetPercentage = null;
            Boolean isTargetMet = null;
            if (targetParts.containsKey(partId)) {
                targetPercentage = targetParts.get(partId).doubleValue();
                isTargetMet = percentageRounded >= targetPercentage;
            }

            List<TagBreakdownDto> weakTags = buildTagBreakdown(
                    qIds, statusMap, questionNumberMap, tagsByQuestion, tagMap);

            parts.add(PartBreakdownDto.builder()
                    .examPartId(partId)
                    .partName(examPart.getName())
                    .skillId(examPart.getSkillId())
                    .skillName(resolveSkillName(skill, examTypeName))
                    .correct(correct)
                    .wrong(wrong)
                    .total(total)
                    .percentage(percentageRounded)
                    .targetPercentage(targetPercentage)
                    .isTargetMet(isTargetMet)
                    .weakTags(weakTags)
                    .build());
        }

        parts.sort(
                Comparator.comparingInt((PartBreakdownDto part) ->
                                partDisplayOrder(examPartMap.get(part.getExamPartId())))
                        .thenComparing(PartBreakdownDto::getPartName, String.CASE_INSENSITIVE_ORDER)
        );
        return parts;
    }

    private List<TagBreakdownDto> buildTagBreakdown(
            List<String> questionIds,
            Map<String, String> statusMap,
            Map<String, Integer> questionNumberMap,
            Map<String, List<QuestionTag>> tagsByQuestion,
            Map<String, Tag> tagMap) {

        Map<String, int[]> tagStats = new HashMap<>();
        Map<String, List<TagQuestionRefDto>> tagQuestions = new HashMap<>();

        for (String qId : questionIds) {
            List<QuestionTag> qTags = tagsByQuestion.getOrDefault(qId, List.of());
            String status = statusMap.getOrDefault(qId, "skipped");
            int number = questionNumberMap.getOrDefault(qId, 0);

            for (QuestionTag qt : qTags) {
                int[] stats = tagStats.computeIfAbsent(qt.getTagId(), k -> new int[]{0, 0, 0});
                switch (status) {
                    case "correct" -> stats[0]++;
                    case "wrong" -> stats[1]++;
                    default -> stats[2]++;
                }
                tagQuestions.computeIfAbsent(qt.getTagId(), k -> new ArrayList<>())
                        .add(TagQuestionRefDto.builder()
                                .questionId(qId)
                                .questionNumber(number)
                                .status(status)
                                .build());
            }
        }

        List<TagBreakdownDto> tags = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : tagStats.entrySet()) {
            String tagId = entry.getKey();
            int[] stats = entry.getValue();
            int correct = stats[0];
            int wrong = stats[1];
            int skipped = stats[2];
            int total = correct + wrong + skipped;
            double percentage = total > 0 ? (double) correct / total * 100 : 0;

            Tag tag = tagMap.get(tagId);

            List<TagQuestionRefDto> qs = tagQuestions.getOrDefault(tagId, new ArrayList<>());
            qs.sort(Comparator.comparingInt(TagQuestionRefDto::getQuestionNumber));

            tags.add(TagBreakdownDto.builder()
                    .tagId(tagId)
                    .tagName(tag != null ? tag.getName() : "Unknown")
                    .correct(correct)
                    .wrong(wrong)
                    .skipped(skipped)
                    .total(total)
                    .percentage(Math.round(percentage * 10.0) / 10.0)
                    .questions(qs)
                    .build());
        }

        tags.sort(Comparator.comparingDouble(TagBreakdownDto::getPercentage));
        return tags;
    }

    private Map<String, Integer> buildQuestionNumberMap(String testId) {
        List<com.project_exam.backend.modules.assessment.test.domain.TestPart> parts =
                testPartRepository.findByTestId(testId);
        if (parts.isEmpty()) return Map.of();

        List<String> partIds = parts.stream()
                .map(com.project_exam.backend.modules.assessment.test.domain.TestPart::getTestPartId)
                .toList();
        Map<String, List<TestQuestion>> byPart = testQuestionRepository.findByTestPartIdIn(partIds).stream()
                .collect(Collectors.groupingBy(TestQuestion::getTestPartId));

        Map<String, Integer> numberMap = new HashMap<>();
        int num = 0;
        for (com.project_exam.backend.modules.assessment.test.domain.TestPart tp : parts) {
            List<TestQuestion> qs = new ArrayList<>(byPart.getOrDefault(tp.getTestPartId(), List.of()));
            qs.sort(Comparator.comparingInt(tq ->
                    tq.getDisplayOrder() == null ? Integer.MAX_VALUE : tq.getDisplayOrder()));
            for (TestQuestion tq : qs) {
                numberMap.put(tq.getQuestionId(), ++num);
            }
        }
        return numberMap;
    }

    /**
     * Readiness = trung bình % đúng của từng Skill (mỗi Skill trọng số như nhau), gộp từ partBreakdown.
     * Không dựng DTO theo Skill vì FE chỉ hiển thị readiness + breakdown theo Part.
     */
    private int calculateReadinessScore(List<PartBreakdownDto> partBreakdown, double overallPercentage) {
        Map<String, int[]> skillStats = new LinkedHashMap<>();
        for (PartBreakdownDto part : partBreakdown) {
            int[] stats = skillStats.computeIfAbsent(part.getSkillId(), k -> new int[]{0, 0});
            stats[0] += part.getCorrect();
            stats[1] += part.getWrong();
        }
        if (skillStats.isEmpty()) {
            return (int) Math.round(overallPercentage);
        }

        double sum = 0;
        for (int[] stats : skillStats.values()) {
            int total = stats[0] + stats[1];
            double percentage = total > 0 ? (double) stats[0] / total * 100 : 0;
            sum += Math.round(percentage * 10.0) / 10.0;
        }
        return (int) Math.round(sum / skillStats.size());
    }

    private Integer calculatePercentile(String testId, Integer totalScore) {
        if (totalScore == null) return null;
        long totalCompleted = userTestRepository.countByTestIdAndStatus(
                testId, UserTest.Status.COMPLETED);
        if (totalCompleted <= 1) return null;

        long scoreLessOrEqual = userTestRepository.countByTestIdAndStatusAndTotalScoreLessThanEqual(
                testId, UserTest.Status.COMPLETED, totalScore);
        return (int) Math.round((double) (scoreLessOrEqual - 1) / (totalCompleted - 1) * 100);
    }

    private Set<String> getAnalyzedQuestionIds(UserTest userTest) {
        Set<String> practicePartIds = userTest.isPractice()
                ? parsePracticePartIds(userTest.getPracticePartIds())
                : Collections.emptySet();

        List<String> testPartIds = testPartRepository.findByTestId(userTest.getTestId()).stream()
                .filter(tp -> practicePartIds.isEmpty() || practicePartIds.contains(tp.getExamPartId()))
                .map(tp -> tp.getTestPartId())
                .toList();
        if (testPartIds.isEmpty()) return Set.of();
        return testQuestionRepository.findByTestPartIdIn(testPartIds).stream()
                .map(TestQuestion::getQuestionId)
                .collect(Collectors.toSet());
    }

    private Set<String> parsePracticePartIds(String csv) {
        if (csv == null || csv.isBlank()) return Collections.emptySet();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private List<UserAnswer> deduplicateByQuestionId(List<UserAnswer> userAnswers) {
        Map<String, UserAnswer> uniqueByQuestionId = new LinkedHashMap<>();
        for (UserAnswer ua : userAnswers) {
            if (ua.getQuestionId() == null) continue;
            uniqueByQuestionId.putIfAbsent(ua.getQuestionId(), ua);
        }
        return new ArrayList<>(uniqueByQuestionId.values());
    }

    private int partDisplayOrder(ExamPart part) {
        return part != null && part.getDisplayOrder() != null
                ? part.getDisplayOrder()
                : Integer.MAX_VALUE;
    }
}
