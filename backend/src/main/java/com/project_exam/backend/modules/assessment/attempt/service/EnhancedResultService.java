package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.dto.*;
import com.project_exam.backend.modules.assessment.attempt.repository.UserAnswerRepository;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.exam.domain.*;
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
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
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
    private final ResourceTagRepository resourceTagRepository;
    private final RecoveryResourceRepository recoveryResourceRepository;
    private final ScoringConversionRepository scoringConversionRepository;
    private final TagRepository tagRepository;
    private final UserTargetRepository userTargetRepository;
    private final UserTargetPartRepository userTargetPartRepository;

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
                    .skillBreakdown(List.of())
                    .partBreakdown(List.of())
                    .recommendations(List.of())
                    .build();
        }

        // 1. Load test metadata
        Test test = testRepository.findById(userTest.getTestId())
                .orElseThrow(() -> new NotFoundException("Test not found"));

        String examCategoryCode = null;
        if (test.getExamCategoryId() != null) {
            examCategoryCode = examCategoryRepository.findById(test.getExamCategoryId())
                    .map(ExamCategory::getCode)
                    .orElse(null);
        }

        // 2. Load ALL question IDs from test structure (not just answered ones)
        Set<String> allTestQuestionIds = getAllQuestionIdsInTest(userTest.getTestId());
        long totalQuestions = allTestQuestionIds.size();

        if (allTestQuestionIds.isEmpty()) {
            return EnhancedResultDto.builder()
                    .correct(0).wrong(0).total(0).totalScore(userTest.getTotalScore() != null ? (long) userTest.getTotalScore() : 0L)
                    .skillBreakdown(List.of()).partBreakdown(List.of()).recommendations(List.of())
                    .build();
        }

        // 3. Load user answers + deduplicate
        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTest.getUserTestId());
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);

        Map<String, UserAnswer> answeredMap = uniqueAnswers.stream()
                .collect(Collectors.toMap(UserAnswer::getQuestionId, ua -> ua, (a1, a2) -> a1));

        // 4. Load ALL questions + correct answers (cả câu chưa khoanh)
        Map<String, Question> questionMap = questionRepository.findAllById(allTestQuestionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q, (q1, q2) -> q1));

        Map<String, Answer> correctAnswersMap = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(allTestQuestionIds)).stream()
                .collect(Collectors.toMap(Answer::getQuestionId, a -> a, (a1, a2) -> a1));

        // 5. Check correctness per question — câu không khoanh = SAI
        Map<String, Boolean> correctnessMap = new HashMap<>();
        long totalCorrect = 0;
        for (String qId : allTestQuestionIds) {
            Question question = questionMap.get(qId);
            Answer correctAnswer = correctAnswersMap.get(qId);
            UserAnswer ua = answeredMap.get(qId);

            if (question == null) continue;

            boolean isCorrect = false;
            if (ua != null && correctAnswer != null) {
                isCorrect = checkCorrectness(ua, question, correctAnswer);
            }
            // Câu không khoanh (ua == null) → isCorrect = false (SAI)

            correctnessMap.put(qId, isCorrect);
            if (isCorrect) totalCorrect++;
        }

        long normalizedCorrect = Math.min(totalCorrect, totalQuestions);
        long totalWrong = totalQuestions - normalizedCorrect;

        // 5. Load ExamParts + Skills
        Set<String> examPartIds = questionMap.values().stream()
                .map(Question::getExamPartId)
                .collect(Collectors.toSet());

        Map<String, ExamPart> examPartMap = examPartRepository.findAllById(examPartIds).stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, ep -> ep));

        Set<String> skillIds = examPartMap.values().stream()
                .map(ExamPart::getSkillId)
                .collect(Collectors.toSet());

        Map<String, Skill> skillMap = skillRepository.findAllById(skillIds).stream()
                .collect(Collectors.toMap(Skill::getSkillId, s -> s));

        // 6. Load tags for all questions (for tầng 3)
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

        // 7. Load Target
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

        // 8. Build Part breakdown (tầng 2.5 + tầng 3)
        List<PartBreakdownDto> partBreakdown = buildPartBreakdown(
                questionMap, correctnessMap, examPartMap, skillMap, tagsByQuestion, tagMap, targetParts);

        // 9. Build Skill breakdown (tầng 2) - aggregate from parts
        List<SkillBreakdownDto> skillBreakdown = buildSkillBreakdown(
                partBreakdown, test.getExamTypeId(), skillMap);

        // 9. Calculate readiness
        double overallPercentage = totalQuestions > 0
                ? (double) normalizedCorrect / totalQuestions * 100 : 0;
        int readinessScore = calculateReadinessScore(skillBreakdown, overallPercentage);
        String readinessLevel = getReadinessLevel(readinessScore);

        // 10. Calculate percentile
        Integer percentile = calculatePercentile(userTest.getTestId(), userTest.getTotalScore());

        // 11. Pass/fail
        boolean passed = overallPercentage >= 70;

        // 14. Build recovery recommendations
        List<RecoveryRecommendationDto> recommendations = buildRecommendations(
                partBreakdown, tagMap, allTagIds);

        return EnhancedResultDto.builder()
                .correct(normalizedCorrect)
                .wrong(totalWrong)
                .total(totalQuestions)
                .totalScore("QUICK_CHALLENGE".equals(examCategoryCode) ? null
                        : (userTest.getTotalScore() != null ? (long) userTest.getTotalScore() : 0L))
                .examCategoryCode(examCategoryCode)
                .examTypeId(test.getExamTypeId())
                .hasTarget(userTargetOpt.isPresent())
                .targetScore(userTargetOpt.map(UserTarget::getTargetScore).orElse(null))
                .skillBreakdown(skillBreakdown)
                .partBreakdown(partBreakdown)
                .readinessScore(readinessScore)
                .readinessLevel(readinessLevel)
                .passed(passed)
                .percentile(percentile)
                .recommendations(recommendations)
                .build();
    }

    // --- Helper methods ---

    private boolean checkCorrectness(UserAnswer ua, Question question, Answer correctAnswer) {
        if (question.getQuestionType() == Question.QuestionType.MCQ) {
            return ua.getSelectedAnswerId() != null
                    && ua.getSelectedAnswerId().equals(correctAnswer.getAnswerId());
        } else if (question.getQuestionType() == Question.QuestionType.FILL_BLANK) {
            return ua.getAnswerText() != null
                    && ua.getAnswerText().trim().equalsIgnoreCase(correctAnswer.getAnswerText().trim());
        }
        return false;
    }

    private List<PartBreakdownDto> buildPartBreakdown(
            Map<String, Question> questionMap,
            Map<String, Boolean> correctnessMap,
            Map<String, ExamPart> examPartMap,
            Map<String, Skill> skillMap,
            Map<String, List<QuestionTag>> tagsByQuestion,
            Map<String, Tag> tagMap,
            Map<String, Integer> targetParts) {

        // Group questions by examPartId
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

            // Tầng 3: Tag breakdown cho tất cả câu hỏi trong part
            List<TagBreakdownDto> weakTags = buildTagBreakdown(
                    qIds, correctnessMap, tagsByQuestion, tagMap);

            parts.add(PartBreakdownDto.builder()
                    .examPartId(partId)
                    .partName(examPart.getName())
                    .skillId(examPart.getSkillId())
                    .skillName(skill != null ? skill.getName() : "Unknown")
                    .correct(correct)
                    .wrong(wrong)
                    .total(total)
                    .percentage(percentageRounded)
                    .targetPercentage(targetPercentage)
                    .isTargetMet(isTargetMet)
                    .weakTags(weakTags)
                    .build());
        }

        // Sort by percentage ascending (weakest first)
        parts.sort(Comparator.comparingDouble(PartBreakdownDto::getPercentage));
        return parts;
    }

    private List<TagBreakdownDto> buildTagBreakdown(
            List<String> questionIds,
            Map<String, Boolean> correctnessMap,
            Map<String, List<QuestionTag>> tagsByQuestion,
            Map<String, Tag> tagMap) {

        // Aggregate correct/wrong per tag
        Map<String, int[]> tagStats = new HashMap<>(); // tagId -> [correct, wrong]

        for (String qId : questionIds) {
            List<QuestionTag> qTags = tagsByQuestion.getOrDefault(qId, List.of());
            Boolean isCorrect = correctnessMap.get(qId);

            for (QuestionTag qt : qTags) {
                int[] stats = tagStats.computeIfAbsent(qt.getTagId(), k -> new int[]{0, 0});
                if (isCorrect != null && isCorrect) {
                    stats[0]++;
                } else {
                    stats[1]++;
                }
            }
        }

        List<TagBreakdownDto> tags = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : tagStats.entrySet()) {
            String tagId = entry.getKey();
            int[] stats = entry.getValue();
            int correct = stats[0];
            int wrong = stats[1];
            int total = correct + wrong;
            double percentage = total > 0 ? (double) correct / total * 100 : 0;

            Tag tag = tagMap.get(tagId);

            tags.add(TagBreakdownDto.builder()
                    .tagId(tagId)
                    .tagName(tag != null ? tag.getName() : "Unknown")
                    .correct(correct)
                    .wrong(wrong)
                    .total(total)
                    .percentage(Math.round(percentage * 10.0) / 10.0)
                    .build());
        }

        // Sort by percentage ascending (weakest first)
        tags.sort(Comparator.comparingDouble(TagBreakdownDto::getPercentage));
        return tags;
    }

    private List<SkillBreakdownDto> buildSkillBreakdown(
            List<PartBreakdownDto> partBreakdown,
            String examTypeId,
            Map<String, Skill> skillMap) {

        // Aggregate parts by skill
        Map<String, int[]> skillStats = new LinkedHashMap<>(); // skillId -> [correct, wrong]

        for (PartBreakdownDto part : partBreakdown) {
            int[] stats = skillStats.computeIfAbsent(part.getSkillId(), k -> new int[]{0, 0});
            stats[0] += part.getCorrect();
            stats[1] += part.getWrong();
        }

        List<SkillBreakdownDto> skills = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : skillStats.entrySet()) {
            String skillId = entry.getKey();
            int[] stats = entry.getValue();
            int correct = stats[0];
            int wrong = stats[1];
            int total = correct + wrong;
            double percentage = total > 0 ? (double) correct / total * 100 : 0;

            Skill skill = skillMap.get(skillId);

            // Try to get converted score (TOEIC style)
            Integer convertedScore = null;
            if (examTypeId != null) {
                convertedScore = scoringConversionRepository
                        .findByExamTypeIdAndSkillIdAndNumCorrect(examTypeId, skillId, correct)
                        .map(ScoringConversion::getConvertedScore)
                        .orElse(null);
            }

            skills.add(SkillBreakdownDto.builder()
                    .skillId(skillId)
                    .skillName(skill != null ? skill.getName() : "Unknown")
                    .correct(correct)
                    .wrong(wrong)
                    .total(total)
                    .percentage(Math.round(percentage * 10.0) / 10.0)
                    .convertedScore(convertedScore)
                    .build());
        }

        return skills;
    }

    private int calculateReadinessScore(List<SkillBreakdownDto> skillBreakdown, double overallPercentage) {
        if (skillBreakdown.isEmpty()) {
            return (int) Math.round(overallPercentage);
        }
        // Weighted average (equal weight for MVP)
        double sum = skillBreakdown.stream()
                .mapToDouble(SkillBreakdownDto::getPercentage)
                .sum();
        return (int) Math.round(sum / skillBreakdown.size());
    }

    private String getReadinessLevel(int readinessScore) {
        if (readinessScore < 60) return "NOT_READY";
        if (readinessScore < 75) return "NEEDS_IMPROVEMENT";
        if (readinessScore < 85) return "ALMOST_READY";
        return "READY";
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

    private List<RecoveryRecommendationDto> buildRecommendations(
            List<PartBreakdownDto> partBreakdown,
            Map<String, Tag> tagMap,
            Set<String> allTagIds) {

        // Collect weak tag IDs (percentage < 60%)
        Set<String> weakTagIds = new LinkedHashSet<>();
        Map<String, String> tagToSkillName = new HashMap<>();

        for (PartBreakdownDto part : partBreakdown) {
            if (part.getWeakTags() == null) continue;
            
            boolean shouldFocus = false;
            if (part.getIsTargetMet() != null) {
                shouldFocus = !part.getIsTargetMet();
            } else {
                shouldFocus = part.getPercentage() < 60;
            }

            if (!shouldFocus) continue;

            for (TagBreakdownDto tag : part.getWeakTags()) {
                double threshold = part.getTargetPercentage() != null ? part.getTargetPercentage() : 60.0;
                if (tag.getPercentage() < threshold) {
                    weakTagIds.add(tag.getTagId());
                    tagToSkillName.put(tag.getTagId(), part.getSkillName());
                }
            }
        }

        if (weakTagIds.isEmpty()) return List.of();

        // Find recovery resources linked to weak tags
        List<ResourceTag> resourceTags = resourceTagRepository.findByTagIdIn(weakTagIds);

        Set<String> resourceIds = resourceTags.stream()
                .map(ResourceTag::getResourceId)
                .collect(Collectors.toSet());

        if (resourceIds.isEmpty()) return List.of();

        Map<String, RecoveryResource> resourceMap = recoveryResourceRepository
                .findAllById(resourceIds).stream()
                .collect(Collectors.toMap(RecoveryResource::getResourceId, r -> r));

        // Build recommendations (deduplicate by resourceId, collect all tags)
        Map<String, RecoveryRecommendationDto> seen = new LinkedHashMap<>();
        for (ResourceTag rt : resourceTags) {
            RecoveryResource resource = resourceMap.get(rt.getResourceId());
            if (resource == null) continue;

            Tag tag = tagMap.get(rt.getTagId());
            String tagName = tag != null ? tag.getName() : "";

            if (seen.containsKey(rt.getResourceId())) {
                RecoveryRecommendationDto existing = seen.get(rt.getResourceId());
                if (!tagName.isEmpty() && !existing.getTagNames().contains(tagName)) {
                    existing.getTagNames().add(tagName);
                }
                continue;
            }

            String skillName = tagToSkillName.getOrDefault(rt.getTagId(), "");
            List<String> tagNames = new ArrayList<>();
            if (!tagName.isEmpty()) tagNames.add(tagName);

            seen.put(rt.getResourceId(), RecoveryRecommendationDto.builder()
                    .skillName(skillName)
                    .tagNames(tagNames)
                    .resourceId(resource.getResourceId())
                    .resourceTitle(resource.getTitle())
                    .resourceUrl(resource.getUrl())
                    .resourceDescription(resource.getDescription())
                    .build());
        }

        return new ArrayList<>(seen.values());
    }

    private Set<String> getAllQuestionIdsInTest(String testId) {
        List<String> testPartIds = testPartRepository.findByTestId(testId).stream()
                .map(tp -> tp.getTestPartId())
                .toList();
        if (testPartIds.isEmpty()) return Set.of();
        return testQuestionRepository.findByTestPartIdIn(testPartIds).stream()
                .map(TestQuestion::getQuestionId)
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
}
