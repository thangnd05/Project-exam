package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.dto.*;
import com.project_exam.backend.modules.assessment.attempt.repository.UserAnswerRepository;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.exam.domain.*;
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
    private final ResourceTagRepository resourceTagRepository;
    private final RecoveryResourceRepository recoveryResourceRepository;
    private final ScoringConversionRepository scoringConversionRepository;
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
                    .skillBreakdown(List.of())
                    .partBreakdown(List.of())
                    .recommendations(List.of())
                    .build();
        }

        // 1. Load test metadata
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

        // 2. Load question IDs from test structure (not just answered ones).
        // Mode PRACTICE chỉ phân tích các Part đã chọn, không lấy toàn bộ đề.
        Set<String> allTestQuestionIds = getAnalyzedQuestionIds(userTest);
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

        Map<String, List<Answer>> correctAnswersMap = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(allTestQuestionIds)).stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        // 5. Check correctness per question — câu không khoanh = SAI
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
            // Câu không khoanh (ua == null) isCorrect = false (SAI)

            correctnessMap.put(qId, isCorrect);
            if (isCorrect) totalCorrect++;
        }

        long normalizedCorrect = Math.min(totalCorrect, totalQuestions);
        long totalWrong = totalQuestions - normalizedCorrect;

        // 4b. Trạng thái từng câu (correct/wrong/skipped) + số câu theo thứ tự hiển thị.
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

        // 5. Load ExamParts + Skills
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
                questionMap, correctnessMap, statusMap, questionNumberMap,
                examPartMap, skillMap, tagsByQuestion, tagMap, targetParts, examTypeName);

        // 9. Build Skill breakdown (tầng 2) - aggregate from parts
        List<SkillBreakdownDto> skillBreakdown = buildSkillBreakdown(
                partBreakdown, test.getExamTypeId(), skillMap, examTypeName);

        // 9. Calculate readiness
        double overallPercentage = totalQuestions > 0
                ? (double) normalizedCorrect / totalQuestions * 100 : 0;
        int readinessScore = calculateReadinessScore(skillBreakdown, overallPercentage);
        String readinessLevel = getReadinessLevel(readinessScore);

        // 10. Calculate percentile
        Integer percentile = calculatePercentile(userTest.getTestId(), userTest.getTotalScore());

        // 11. Pass/fail
        boolean passed = overallPercentage >= 70;

        // 12. Compute gauge fields
        int percentage = (int) Math.round(overallPercentage);
        boolean isQuickChallenge = "QUICK_CHALLENGE".equals(examCategoryCode);
        boolean hasTarget = userTargetOpt.isPresent();
        Integer targetScore = userTargetOpt.map(UserTarget::getTargetScore).orElse(null);
        Long totalScoreVal = isQuickChallenge ? null
                : (userTest.getTotalScore() != null ? (long) userTest.getTotalScore() : 0L);

        GaugeInfo gauge = computeGauge(isQuickChallenge, percentage, hasTarget, targetScore,
                totalScoreVal, readinessScore, readinessLevel);

        // 13. Compute isTargetMet (top-level)
        Boolean isTargetMetResult = null;
        if (hasTarget && targetScore != null && totalScoreVal != null) {
            isTargetMetResult = totalScoreVal >= targetScore;
        }

        // 14. Build recovery recommendations
        List<RecoveryRecommendationDto> recommendations = buildRecommendations(
                partBreakdown, tagMap, allTagIds);

        // 15. Recovery message
        String recoveryMessage = buildRecoveryMessage(hasTarget, isTargetMetResult, readinessScore);

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
                .gaugePercentage(gauge.gaugePercentage())
                .displayValue(gauge.displayValue())
                .gaugeLabel(gauge.gaugeLabel())
                .gaugeTitle(gauge.gaugeTitle())
                .gaugeMessage(gauge.gaugeMessage())
                .skillBreakdown(skillBreakdown)
                .partBreakdown(partBreakdown)
                .readinessScore(readinessScore)
                .readinessLevel(readinessLevel)
                .passed(passed)
                .percentile(percentile)
                .recoveryMessage(recoveryMessage)
                .recommendations(recommendations)
                .build();
    }

    // --- Helper methods ---

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

    /** 5 field của "đồng hồ" kết quả (gauge) hiển thị ở đầu trang kết quả. */
    private record GaugeInfo(int gaugePercentage, String displayValue, String gaugeLabel,
                             String gaugeTitle, String gaugeMessage) {}

    /**
     * Tính gauge theo ngữ cảnh: Quick Challenge (theo % chính xác), có Target (theo điểm mục tiêu),
     * hoặc mặc định (theo readiness). Chỉ dựng dữ liệu hiển thị — không đổi so với bản inline cũ.
     */
    private GaugeInfo computeGauge(boolean isQuickChallenge, int percentage, boolean hasTarget,
                                   Integer targetScore, Long totalScoreVal,
                                   int readinessScore, String readinessLevel) {
        if (isQuickChallenge) {
            String title;
            String message;
            if (percentage >= 85) {
                title = "Xuất sắc";
                message = "Bạn nắm rất vững kiến thức phần này!";
            } else if (percentage >= 60) {
                title = "Khá tốt";
                message = "Bạn đã hiểu phần lớn, cần trau dồi thêm một chút.";
            } else if (percentage >= 30) {
                title = "Tạm ổn";
                message = "Bạn cần ôn lại một số kiến thức cơ bản.";
            } else {
                title = "Cần luyện thêm";
                message = "Hãy dành thời gian củng cố nền tảng kiến thức.";
            }
            return new GaugeInfo(percentage, percentage + "%", "Độ chính xác", title, message);
        }
        if (hasTarget && targetScore != null) {
            long ts = totalScoreVal != null ? totalScoreVal : 0;
            boolean targetMet = ts >= targetScore;
            int gaugePercentage = Math.min(100, (int) Math.round((double) ts / targetScore * 100));
            String title = targetMet ? "Đạt mục tiêu!" : "Chưa đạt mục tiêu";
            String message = targetMet
                    ? "Chúc mừng! Bạn đã đạt mức điểm mục tiêu " + targetScore + " đề ra."
                    : "Bạn còn thiếu " + (targetScore - ts) + " điểm nữa để đạt mục tiêu.";
            return new GaugeInfo(gaugePercentage, ts + "/" + targetScore, "Mục tiêu", title, message);
        }
        return new GaugeInfo(readinessScore, readinessScore + "%", "Độ sẵn sàng",
                getGaugeTitle(readinessLevel), getGaugeMessage(readinessLevel));
    }

    /** Thông điệp gợi ý lộ trình (null nếu đã đạt target / readiness đủ cao). Giữ nguyên logic cũ. */
    private String buildRecoveryMessage(boolean hasTarget, Boolean isTargetMetResult, int readinessScore) {
        if (hasTarget && !Boolean.TRUE.equals(isTargetMetResult)) {
            return "Mục tiêu của bạn: Lấp đầy khoảng trống kiến thức để đạt target. " +
                    "Hãy lập kế hoạch học để luyện tập theo những phần thi bạn chưa đạt mục tiêu đề ra.";
        } else if (!hasTarget && readinessScore < 85) {
            int nextTarget = Math.min(readinessScore + 10, 100);
            return "Mục tiêu: tăng độ sẵn sàng từ " + readinessScore + "% lên " + nextTarget + "%. " +
                    "Hãy đặt mục tiêu điểm và aim từng phần thi để hệ thống gợi ý lộ trình phù hợp.";
        }
        return null;
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
            String targetGapMessage = null;
            if (targetParts.containsKey(partId)) {
                targetPercentage = targetParts.get(partId).doubleValue();
                isTargetMet = percentageRounded >= targetPercentage;
                if (isTargetMet) {
                    targetGapMessage = "(Đạt mục tiêu " + targetPercentage.intValue() + "%)";
                } else {
                    double gap = Math.max(0, targetPercentage - percentageRounded);
                    String gapStr = gap == Math.floor(gap) ? String.valueOf((int) gap) : String.format("%.1f", gap);
                    targetGapMessage = "(Cần thêm " + gapStr + "% để đạt " + targetPercentage.intValue() + "%)";
                }
            }

            // Tầng 3: Tag breakdown cho tất cả câu hỏi trong part
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
                    .targetGapMessage(targetGapMessage)
                    .weakTags(weakTags)
                    .build());
        }

        // Giữ thứ tự hiển thị theo part (Part 1 -> Part N), không sort theo % đúng.
        parts.sort(
                Comparator.comparingInt((PartBreakdownDto part) -> extractPartOrder(part.getPartName()))
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

        // Aggregate per tag: [correct, wrong, skipped] + danh sách câu
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

        // Sort by percentage ascending (weakest first)
        tags.sort(Comparator.comparingDouble(TagBreakdownDto::getPercentage));
        return tags;
    }

    /** Map questionId -> số câu (đánh số liên tục theo thứ tự part rồi displayOrder). */
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

    private List<SkillBreakdownDto> buildSkillBreakdown(
            List<PartBreakdownDto> partBreakdown,
            String examTypeId,
            Map<String, Skill> skillMap,
            String examTypeName) {

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
                    .skillName(resolveSkillName(skill, examTypeName))
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

    private String getGaugeTitle(String readinessLevel) {
        return switch (readinessLevel) {
            case "READY" -> "Sẵn sàng cao";
            case "ALMOST_READY" -> "Gần sẵn sàng";
            case "NEEDS_IMPROVEMENT" -> "Cần cải thiện";
            default -> "Chưa nên thi";
        };
    }

    private String getGaugeMessage(String readinessLevel) {
        return switch (readinessLevel) {
            case "READY" -> "Bạn có thể cân nhắc đăng ký thi nếu duy trì kết quả ổn định.";
            case "ALMOST_READY" -> "Tập trung sửa lỗi sai và làm final check.";
            case "NEEDS_IMPROVEMENT" -> "Bạn gần đạt nhưng còn lĩnh vực yếu có thể kéo tụt điểm.";
            default -> "Bạn cần củng cố nền tảng trước khi làm mock tiếp.";
        };
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
                    .originalFileName(resource.getOriginalFileName())
                    .resourceDescription(resource.getDescription())
                    .build());
        }

        return new ArrayList<>(seen.values());
    }

    /**
     * Các câu hỏi cần phân tích cho kết quả. Mode FULL_TEST lấy toàn bộ đề;
     * mode PRACTICE chỉ lấy các Part người dùng đã chọn luyện tập (practicePartIds).
     */
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

    private int extractPartOrder(String partName) {
        if (partName == null) {
            return Integer.MAX_VALUE;
        }
        String digits = partName.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            return Integer.MAX_VALUE;
        }
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException exception) {
            return Integer.MAX_VALUE;
        }
    }
}
