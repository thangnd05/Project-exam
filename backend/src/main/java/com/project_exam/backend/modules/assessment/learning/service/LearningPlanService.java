package com.project_exam.backend.modules.assessment.learning.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.dto.EnhancedResultDto;
import com.project_exam.backend.modules.assessment.attempt.dto.PartBreakdownDto;
import com.project_exam.backend.modules.assessment.attempt.dto.TagBreakdownDto;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.attempt.service.EnhancedResultService;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.modules.assessment.learning.domain.*;
import com.project_exam.backend.modules.assessment.learning.dto.GeneratePlanRequest;
import com.project_exam.backend.modules.assessment.learning.dto.PlanResponse;
import com.project_exam.backend.modules.assessment.learning.mapper.LearningMapper;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanQuestionTargets;
import com.project_exam.backend.modules.assessment.learning.support.PlanPrioritySupport;
import com.project_exam.backend.modules.assessment.learning.support.PlanTaskViewAssembler;
import com.project_exam.backend.modules.assessment.learning.support.ReadinessThresholds;
import com.project_exam.backend.modules.assessment.target.service.UserTargetProgressService;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanRepository;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanSessionAnswerRepository;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanSessionQuestionRepository;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanSessionRepository;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanTaskRepository;
import com.project_exam.backend.modules.assessment.target.domain.UserTarget;
import com.project_exam.backend.modules.assessment.target.repository.UserTargetRepository;
import com.project_exam.backend.modules.assessment.target.service.UserTargetService;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import com.project_exam.backend.modules.assessment.test.repository.TestPartRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestQuestionRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningPlanService {

    private static final int DEFAULT_PASS_ACCURACY = 70;
    private static final int DEFAULT_WEAK_TAG_THRESHOLD = 60;
    private static final int ESTIMATED_DAYS_PER_TASK = 2;

    private final EnhancedResultService enhancedResultService;
    private final LearningPlanRepository planRepository;
    private final LearningPlanTaskRepository taskRepository;
    private final UserTestRepository userTestRepository;
    private final TestRepository testRepository;
    private final ExamPartRepository examPartRepository;
    private final UserTargetRepository userTargetRepository;
    private final UserTargetService userTargetService;
    private final TagRepository tagRepository;
    private final QuestionTagRepository questionTagRepository;
    private final QuestionRepository questionRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final PlanTaskViewAssembler taskViewAssembler;
    private final UserTargetProgressService userTargetProgressService;
    private final LearningPlanSessionRepository sessionRepository;
    private final LearningPlanSessionQuestionRepository sessionQuestionRepository;
    private final LearningPlanSessionAnswerRepository sessionAnswerRepository;
    private final LearningMapper learningMapper;

    @Transactional
    public PlanResponse generatePlan(String userId, GeneratePlanRequest request) {
        UserTest userTest = userTestRepository.findById(request.getUserTestId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài thi nguồn"));
        if (!Objects.equals(userTest.getUserId(), userId)) {
            throw new ForbiddenException("Bạn không có quyền dùng bài thi này để sinh kế hoạch");
        }
        if (userTest.getStatus() != UserTest.Status.COMPLETED) {
            throw new BadRequestException("Bài thi chưa hoàn thành, không thể sinh kế hoạch");
        }

        Test test = testRepository.findById(userTest.getTestId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đề thi"));
        String examTypeId = test.getExamTypeId();

        EnhancedResultDto result = enhancedResultService.getEnhancedResult(
                request.getUserTestId(), userId);
        List<PartBreakdownDto> partBreakdown = result.getPartBreakdown();
        if (partBreakdown == null || partBreakdown.isEmpty()) {
            throw new BadRequestException("Bài thi không có dữ liệu phân tích phần, không thể sinh kế hoạch");
        }

        userTargetProgressService.syncPartScoresFromMock(
                userId, examTypeId, request.getUserTestId(), userTest.getFinishedAt(), result);

        if (userTargetProgressService.markTargetAchievedIfMet(userId, examTypeId, result)) {
            closeActivePlans(userId, examTypeId, LearningPlan.Status.COMPLETED, null);
            return buildTargetAchievedResponse(userId, examTypeId, result);
        }

        Optional<UserTarget> userTargetOpt = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId);
        String userTargetId = userTargetOpt.map(UserTarget::getUserTargetId).orElse(null);
        Integer targetScore = resolveTargetScore(userId, examTypeId, request.getTargetScore(), userTargetOpt);
        Map<String, Integer> partRequirements = userTargetService.getEffectiveRequirements(userId, examTypeId);

        Set<String> focusPartIds = request.getFocusExamPartIds() == null
                ? Set.of()
                : new HashSet<>(request.getFocusExamPartIds());

        Map<String, List<String>> questionIdsByPart =
                buildQuestionIdsByPartForTest(userTest.getTestId());

        List<TaskCandidate> candidates = buildTaskCandidates(
                partBreakdown, partRequirements, focusPartIds, questionIdsByPart);
        List<String> partsWithoutTasks = findPartsWithoutTasks(
                partBreakdown, focusPartIds, candidates);

        if (candidates.isEmpty()) {
            String detail = partsWithoutTasks.isEmpty()
                    ? "Các phần trong bài này đều đã đạt ngưỡng riêng — hãy làm một bài thi thử đầy đủ để nâng đều điểm."
                    : "Các phần cần cải thiện (" + String.join(", ", partsWithoutTasks)
                        + ") chưa có ải vì câu hỏi chưa được gắn tag. Gắn tag (admin) rồi sinh lại.";
            throw new BadRequestException("Chưa tạo được lộ trình từ bài này. " + detail);
        }

        int planSequence = (int) planRepository.countByUserIdAndExamTypeId(userId, examTypeId) + 1;

        LearningPlan plan = new LearningPlan();
        plan.setUserId(userId);
        plan.setExamTypeId(examTypeId);
        plan.setSourceUserTestId(request.getUserTestId());
        plan.setUserTargetId(userTargetId);
        plan.setTargetScore(targetScore);
        plan.setDeadlineDays(request.getDeadlineDays());
        plan.setBaselineReadiness(resolveReadinessScore(result));
        plan.setPlanStage(PlanStage.FOUNDATION);
        plan.setPassAccuracyDefault(DEFAULT_PASS_ACCURACY);
        plan.setStatus(LearningPlan.Status.ACTIVE);
        plan.setPlanSequence(planSequence);
        plan.setPartsWithoutTasks(joinPartsWithoutTasks(partsWithoutTasks));
        plan = planRepository.save(plan);

        closeActivePlans(userId, examTypeId, LearningPlan.Status.REPLACED, plan.getLearningPlanId());

        List<LearningPlanTask> savedTasks = new ArrayList<>();
        int order = 1;
        for (TaskCandidate c : candidates) {
            LearningPlanTask task = new LearningPlanTask();
            task.setLearningPlanId(plan.getLearningPlanId());
            task.setExamPartId(c.examPartId());
            task.setTaskType(c.taskType());
            task.setTargetQuestionCount(c.targetQuestionCount());
            task.setTaskOrder(order++);
            task.setPassAccuracy(c.passAccuracy());
            task.setBaselineAccuracy(round2(c.baselinePct()));
            task.setAttemptCount(0);
            task.setWrongCountAtDiagnosis(c.wrongCount());
            if (c.taskType() == PlanTaskType.TAG) {
                task.setTagId(c.tagId());
                task.setStatus(TaskStatus.ACTIVE);
            } else {
                task.setTagId(null);
                task.setStatus(TaskStatus.LOCKED);
            }
            savedTasks.add(task);
        }
        savedTasks = taskRepository.saveAll(savedTasks);
        activateCapstonesWithoutTagPrerequisite(savedTasks);
        savedTasks = taskRepository.saveAll(savedTasks);

        return buildPlanResponse(
                plan,
                result,
                candidates.size(),
                savedTasks,
                partsWithoutTasks,
                taskViewAssembler.lookupsFor(savedTasks),
                loadDiagnosisSources(List.of(plan)).get(plan.getSourceUserTestId()));
    }

    private List<String> findPartsWithoutTasks(
            List<PartBreakdownDto> partBreakdown,
            Set<String> focusPartIds,
            List<TaskCandidate> candidates) {
        Set<String> partsWithTasks = candidates.stream()
                .map(TaskCandidate::examPartId)
                .collect(Collectors.toSet());
        return partBreakdown.stream()
                .filter(p -> matchesFocus(p.getExamPartId(), focusPartIds))
                .filter(this::partNeedsFocus)
                .filter(p -> !partsWithTasks.contains(p.getExamPartId()))
                .map(PartBreakdownDto::getPartName)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanResponse getPlan(String userId, String learningPlanId) {
        LearningPlan plan = requireOwnedPlan(userId, learningPlanId);
        List<LearningPlanTask> tasks = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(learningPlanId);
        return buildPlanResponseFromEntity(
                plan,
                tasks,
                taskViewAssembler.lookupsFor(tasks),
                loadCurrentTargets(userId),
                loadDiagnosisSources(List.of(plan)));
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> listPlans(String userId, String examTypeId) {
        List<LearningPlan> plans = examTypeId == null || examTypeId.isBlank()
                ? planRepository.findByUserIdOrderByCreatedAtDesc(userId)
                : planRepository.findByUserIdAndExamTypeIdOrderByCreatedAtDesc(userId, examTypeId);
        if (plans.isEmpty()) {
            return List.of();
        }

        List<String> planIds = plans.stream().map(LearningPlan::getLearningPlanId).toList();
        Map<String, List<LearningPlanTask>> tasksByPlan = taskRepository
                .findByLearningPlanIdInOrderByTaskOrderAsc(planIds).stream()
                .collect(Collectors.groupingBy(LearningPlanTask::getLearningPlanId));
        List<LearningPlanTask> allTasks = tasksByPlan.values().stream()
                .flatMap(List::stream)
                .toList();

        PlanTaskViewAssembler.Lookups lookups = taskViewAssembler.lookupsFor(allTasks);
        Map<String, UserTarget> currentTargets = loadCurrentTargets(userId);
        Map<String, DiagnosisSource> diagnosisSources = loadDiagnosisSources(plans);

        return plans.stream()
                .map(p -> buildPlanResponseFromEntity(
                        p,
                        tasksByPlan.getOrDefault(p.getLearningPlanId(), List.of()),
                        lookups,
                        currentTargets,
                        diagnosisSources))
                .toList();
    }

    private Map<String, UserTarget> loadCurrentTargets(String userId) {
        return userTargetRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(UserTarget::getExamTypeId, t -> t, (a, b) -> a));
    }

    private Map<String, DiagnosisSource> loadDiagnosisSources(List<LearningPlan> plans) {
        Set<String> userTestIds = plans.stream()
                .map(LearningPlan::getSourceUserTestId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (userTestIds.isEmpty()) {
            return Map.of();
        }
        Map<String, DiagnosisSource> result = new HashMap<>();
        for (Object[] row : userTestRepository.findDiagnosisSourcesByUserTestIdIn(userTestIds)) {
            result.put((String) row[0], new DiagnosisSource(
                    (String) row[1],
                    row[2] == UserTest.Mode.PRACTICE));
        }
        return result;
    }

    private record DiagnosisSource(String categoryCode, boolean practice) {}

    @Transactional
    public PlanResponse switchPlan(String userId, String learningPlanId) {
        LearningPlan plan = requireOwnedPlan(userId, learningPlanId);
        if (plan.getStatus() == LearningPlan.Status.ACTIVE) {
            throw new BadRequestException("Plan này đang là plan hiện tại rồi");
        }
        List<LearningPlan> activePlans = planRepository.findByUserIdAndExamTypeIdAndStatus(
                userId, plan.getExamTypeId(), LearningPlan.Status.ACTIVE);
        for (LearningPlan old : activePlans) {
            old.setStatus(LearningPlan.Status.REPLACED);
            old.setReplacedByPlanId(learningPlanId);
            planRepository.save(old);
        }
        plan.setStatus(LearningPlan.Status.ACTIVE);
        plan.setReplacedByPlanId(null);
        plan = planRepository.save(plan);
        List<LearningPlanTask> tasks = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(learningPlanId);
        return buildPlanResponseFromEntity(
                plan,
                tasks,
                taskViewAssembler.lookupsFor(tasks),
                loadCurrentTargets(userId),
                loadDiagnosisSources(List.of(plan)));
    }

    @Transactional
    public void deletePlan(String userId, String learningPlanId) {
        LearningPlan plan = requireOwnedPlan(userId, learningPlanId);
        List<LearningPlanSession> sessions = sessionRepository.findByLearningPlanId(learningPlanId);
        if (!sessions.isEmpty()) {
            List<String> sessionIds = sessions.stream()
                    .map(LearningPlanSession::getSessionId)
                    .toList();
            sessionAnswerRepository.deleteBySessionIdIn(sessionIds);
            sessionQuestionRepository.deleteBySessionIdIn(sessionIds);
            sessionRepository.deleteByLearningPlanId(learningPlanId);
        }
        taskRepository.deleteByLearningPlanId(learningPlanId);
        planRepository.delete(plan);
    }

    private List<TaskCandidate> buildTaskCandidates(
            List<PartBreakdownDto> partBreakdown,
            Map<String, Integer> partRequirements,
            Set<String> focusPartIds,
            Map<String, List<String>> questionIdsByPart) {
        List<PartBreakdownDto> sortedParts = partBreakdown.stream()
                .filter(p -> matchesFocus(p.getExamPartId(), focusPartIds))
                .sorted(Comparator.comparingDouble(this::partPriorityScore).reversed())
                .toList();

        List<TaskCandidate> candidates = new ArrayList<>();
        for (PartBreakdownDto part : sortedParts) {
            if (!partNeedsFocus(part)) {
                continue;
            }
            int passAccuracy = partRequirements.getOrDefault(
                    part.getExamPartId(), DEFAULT_PASS_ACCURACY);
            double threshold = part.getTargetPercentage() != null
                    ? part.getTargetPercentage()
                    : DEFAULT_WEAK_TAG_THRESHOLD;

            List<String> questionIdsInPart = questionIdsByPart.getOrDefault(
                    part.getExamPartId(), List.of());

            List<TaskCandidate> partTasks = collectTasksForPart(
                    part, threshold, passAccuracy, questionIdsInPart);
            candidates.addAll(partTasks);
        }
        return candidates;
    }

    private boolean partNeedsFocus(PartBreakdownDto part) {
        if (part.getIsTargetMet() != null) {
            return !part.getIsTargetMet();
        }
        double threshold = part.getTargetPercentage() != null
                ? part.getTargetPercentage()
                : DEFAULT_WEAK_TAG_THRESHOLD;
        return part.getPercentage() < threshold;
    }

    private Map<String, List<String>> buildQuestionIdsByPartForTest(String testId) {
        List<TestPart> testParts = testPartRepository.findByTestId(testId);
        if (testParts.isEmpty()) {
            return Map.of();
        }
        List<String> testPartIds = testParts.stream().map(TestPart::getTestPartId).toList();
        List<TestQuestion> testQuestions = testQuestionRepository.findByTestPartIdIn(testPartIds);
        if (testQuestions.isEmpty()) {
            return Map.of();
        }
        List<String> questionIds = testQuestions.stream()
                .map(TestQuestion::getQuestionId)
                .distinct()
                .toList();
        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q, (a, b) -> a));

        Map<String, List<String>> byPart = new LinkedHashMap<>();
        for (TestQuestion tq : testQuestions) {
            Question q = questionMap.get(tq.getQuestionId());
            if (q == null || q.getExamPartId() == null) {
                continue;
            }
            byPart.computeIfAbsent(q.getExamPartId(), k -> new ArrayList<>())
                    .add(q.getQuestionId());
        }
        return byPart;
    }

    private List<TaskCandidate> collectTasksForPart(
            PartBreakdownDto part,
            double threshold,
            int passAccuracy,
            List<String> questionIdsInPart) {
        List<TaskCandidate> partTasks = new ArrayList<>();
        Set<String> usedTagIds = new HashSet<>();

        if (part.getWeakTags() != null) {
            for (TagBreakdownDto tag : part.getWeakTags()) {
                if (tag.getTagId() == null || tag.getPercentage() >= threshold) {
                    continue;
                }
                addTaskIfNew(partTasks, usedTagIds,
                        buildTaskCandidate(tag, tag.getTagId(), part, passAccuracy));
            }
        }

        if (partTasks.isEmpty() && part.getWeakTags() != null) {
            part.getWeakTags().stream()
                    .filter(t -> t.getTagId() != null)
                    .forEach(tag -> addTaskIfNew(partTasks, usedTagIds,
                            buildTaskCandidate(tag, tag.getTagId(), part, passAccuracy)));
        }

        if (partTasks.isEmpty() && !questionIdsInPart.isEmpty()) {
            List<String> tagIds = questionTagRepository.findDistinctTagIdsByQuestionIdIn(questionIdsInPart);
            for (String tagId : tagIds) {
                addTaskIfNew(partTasks, usedTagIds,
                        buildTaskCandidate(null, tagId, part, passAccuracy));
            }
        }

        if (partTasks.isEmpty()) {
            String fallbackTagId = resolveTagIdForExamPart(part.getExamPartId());
            if (fallbackTagId != null) {
                addTaskIfNew(partTasks, usedTagIds,
                        buildTaskCandidate(null, fallbackTagId, part, passAccuracy));
            }
        }

        Map<String, Integer> sortOrderByTag = loadTagSortOrders(partTasks);
        partTasks.sort(
                Comparator.<TaskCandidate>comparingInt(t -> tagSortRank(sortOrderByTag.get(t.tagId())))
                        .thenComparing(Comparator.comparingInt(TaskCandidate::priorityScore).reversed()));

        ExamPart examPart = examPartRepository.findById(part.getExamPartId()).orElse(null);
        int capstoneTarget = LearningPlanQuestionTargets.resolveCapstoneTarget(examPart);
        partTasks.add(buildCapstoneCandidate(
                part, passAccuracy, PlanTaskType.PART_CAPSTONE_1, capstoneTarget));
        partTasks.add(buildCapstoneCandidate(
                part, passAccuracy, PlanTaskType.PART_CAPSTONE_2, capstoneTarget));
        return partTasks;
    }

    private Map<String, Integer> loadTagSortOrders(List<TaskCandidate> tasks) {
        Set<String> tagIds = tasks.stream()
                .map(TaskCandidate::tagId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (tagIds.isEmpty()) {
            return Map.of();
        }
        return tagRepository.findAllById(tagIds).stream()
                .filter(t -> t.getSortOrder() != null)
                .collect(Collectors.toMap(Tag::getTagId, Tag::getSortOrder, (a, b) -> a));
    }

    private int tagSortRank(Integer sortOrder) {
        return sortOrder != null ? sortOrder : Integer.MAX_VALUE;
    }

    private TaskCandidate buildTaskCandidate(
            TagBreakdownDto tag,
            String tagId,
            PartBreakdownDto part,
            int passAccuracy) {
        String resolvedTagId = tagId != null ? tagId : (tag != null ? tag.getTagId() : null);
        int wrong = tag != null ? tag.getWrong() : part.getWrong();
        double baseline = tag != null ? tag.getPercentage() : part.getPercentage();
        int priorityScore = PlanPrioritySupport.computePriorityScore(tag, part, passAccuracy);
        return new TaskCandidate(
                resolvedTagId,
                part.getExamPartId(),
                PlanTaskType.TAG,
                LearningPlanQuestionTargets.TAG_TARGET,
                baseline,
                passAccuracy,
                wrong,
                priorityScore);
    }

    private TaskCandidate buildCapstoneCandidate(
            PartBreakdownDto part,
            int passAccuracy,
            PlanTaskType capstoneType,
            int targetQuestionCount) {
        int capstonePriority = capstoneType == PlanTaskType.PART_CAPSTONE_1 ? 1 : 0;
        return new TaskCandidate(
                null,
                part.getExamPartId(),
                capstoneType,
                targetQuestionCount,
                part.getPercentage(),
                passAccuracy,
                part.getWrong(),
                capstonePriority);
    }

    private void activateCapstonesWithoutTagPrerequisite(List<LearningPlanTask> tasks) {
        Map<String, List<LearningPlanTask>> byPart = tasks.stream()
                .collect(Collectors.groupingBy(LearningPlanTask::getExamPartId));
        for (List<LearningPlanTask> partTasks : byPart.values()) {
            boolean hasTagTasks = partTasks.stream()
                    .anyMatch(t -> t.getTaskType() == PlanTaskType.TAG);
            if (!hasTagTasks) {
                partTasks.stream()
                        .filter(t -> t.getTaskType() == PlanTaskType.PART_CAPSTONE_1)
                        .filter(t -> t.getStatus() == TaskStatus.LOCKED)
                        .forEach(t -> t.setStatus(TaskStatus.ACTIVE));
            }
        }
    }

    private void addTaskIfNew(
            List<TaskCandidate> partTasks,
            Set<String> usedTagIds,
            TaskCandidate candidate) {
        if (candidate.tagId() != null && usedTagIds.add(candidate.tagId())) {
            partTasks.add(candidate);
        }
    }

    private String resolveTagIdForExamPart(String examPartId) {
        List<String> tagIds = questionTagRepository.findDistinctTagIdsByExamPartId(examPartId);
        if (tagIds.isEmpty()) {
            return null;
        }
        return tagIds.get(0);
    }

    private boolean matchesFocus(String examPartId, Set<String> focusPartIds) {
        return focusPartIds.isEmpty() || focusPartIds.contains(examPartId);
    }

    private double partPriorityScore(PartBreakdownDto part) {
        if (Boolean.TRUE.equals(part.getIsTargetMet())) {
            return 0;
        }
        double target = part.getTargetPercentage() != null
                ? part.getTargetPercentage()
                : DEFAULT_WEAK_TAG_THRESHOLD;
        return Math.max(0, target - part.getPercentage());
    }

    private PlanResponse buildPlanResponse(
            LearningPlan plan,
            EnhancedResultDto result,
            int taskCount,
            List<LearningPlanTask> tasks,
            List<String> partsWithoutTasks,
            PlanTaskViewAssembler.Lookups lookups,
            DiagnosisSource diagnosisSource) {
        int estimatedDays = taskCount * ESTIMATED_DAYS_PER_TASK;
        if (plan.getDeadlineDays() != null) {
            estimatedDays = Math.min(estimatedDays, plan.getDeadlineDays());
        }
        long passed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.PASSED).count();

        PlanResponse response = learningMapper.toGeneratedPlanResponse(
                plan,
                ReadinessThresholds.levelFromScore(plan.getBaselineReadiness()),
                plan.getPlanStage().name(),
                buildSummary(result, plan.getTargetScore(), estimatedDays, taskCount, partsWithoutTasks),
                tasks.size(),
                (int) passed,
                estimatedDays,
                taskViewAssembler.toTaskDtos(tasks, lookups),
                taskViewAssembler.buildPartGroups(tasks, lookups),
                partsWithoutTasks);
        response.setRecommendedTaskId(pickRecommendedTaskId(tasks, lookups));
        applyDiagnosisSource(response, diagnosisSource);
        return response;
    }

    private PlanResponse buildPlanResponseFromEntity(
            LearningPlan plan,
            List<LearningPlanTask> tasks,
            PlanTaskViewAssembler.Lookups lookups,
            Map<String, UserTarget> currentTargets,
            Map<String, DiagnosisSource> diagnosisSources) {
        long passed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.PASSED).count();
        int remaining = (int) (tasks.size() - passed);
        int estimatedDays = remaining * ESTIMATED_DAYS_PER_TASK;

        PlanResponse response = learningMapper.toPlanResponseFromEntity(
                plan,
                ReadinessThresholds.levelFromScore(plan.getBaselineReadiness()),
                plan.getPlanStage() != null ? plan.getPlanStage().name() : PlanStage.FOUNDATION.name(),
                String.format(
                        "Plan #%s — %d/%d ải đã pass. %s",
                        plan.getPlanSequence() != null ? plan.getPlanSequence() : "?",
                        passed, tasks.size(),
                        stageLabel(plan.getPlanStage())),
                tasks.size(),
                (int) passed,
                estimatedDays,
                taskViewAssembler.toTaskDtos(tasks, lookups),
                taskViewAssembler.buildPartGroups(tasks, lookups));
        response.setRecommendedTaskId(pickRecommendedTaskId(tasks, lookups));
        response.setTargetOutdated(isTargetOutdated(plan, currentTargets.get(plan.getExamTypeId())));
        applyDiagnosisSource(response, diagnosisSources.get(plan.getSourceUserTestId()));
        response.setPartsWithoutTasks(splitPartsWithoutTasks(plan.getPartsWithoutTasks()));
        return response;
    }

    private void applyDiagnosisSource(PlanResponse response, DiagnosisSource source) {
        response.setDiagnosisSourceCategory(source != null ? source.categoryCode() : null);
        response.setDiagnosisSourcePractice(source != null && source.practice());
    }

    private static String joinPartsWithoutTasks(List<String> names) {
        if (names == null || names.isEmpty()) {
            return null;
        }
        return String.join("\n", names);
    }

    private static List<String> splitPartsWithoutTasks(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return List.of(raw.split("\n"));
    }

    private boolean isTargetOutdated(LearningPlan plan, UserTarget currentTarget) {
        if (plan.getStatus() != LearningPlan.Status.ACTIVE) {
            return false;
        }
        String currentTargetId = currentTarget != null ? currentTarget.getUserTargetId() : null;

        if (!Objects.equals(plan.getUserTargetId(), currentTargetId)) {
            return true;
        }

        Integer currentScore = currentTarget != null ? currentTarget.getTargetScore() : null;
        return !Objects.equals(plan.getTargetScore(), currentScore);
    }

    private PlanResponse buildTargetAchievedResponse(
            String userId, String examTypeId, EnhancedResultDto result) {
        int readiness = resolveReadinessScore(result);
        return learningMapper.toTargetAchievedResponse(
                userId,
                examTypeId,
                readiness,
                ReadinessThresholds.levelFromScore(readiness),
                String.format(
                        "Bạn đã đạt mục tiêu (readiness %d%%). Có thể đặt mục tiêu cao hơn hoặc làm mock kiểm tra trước khi thi thật.",
                        readiness));
    }

    private void closeActivePlans(
            String userId,
            String examTypeId,
            LearningPlan.Status newStatus,
            String replacedByPlanId) {
        List<LearningPlan> activePlans = planRepository.findByUserIdAndExamTypeIdAndStatus(
                userId, examTypeId, LearningPlan.Status.ACTIVE);
        for (LearningPlan old : activePlans) {
            if (replacedByPlanId != null && Objects.equals(old.getLearningPlanId(), replacedByPlanId)) {
                continue;
            }
            old.setStatus(newStatus);
            if (newStatus == LearningPlan.Status.REPLACED && replacedByPlanId != null) {
                old.setReplacedByPlanId(replacedByPlanId);
            }
            planRepository.save(old);
        }
    }

    private String pickRecommendedTaskId(
            List<LearningPlanTask> tasks, PlanTaskViewAssembler.Lookups lookups) {
        return tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.ACTIVE)
                .min(Comparator
                        .comparingInt((LearningPlanTask t) -> partDisplayOrderRank(t, lookups))
                        .thenComparingInt(t -> t.getTaskOrder() != null ? t.getTaskOrder() : Integer.MAX_VALUE))
                .map(LearningPlanTask::getTaskId)
                .orElse(null);
    }

    private int partDisplayOrderRank(LearningPlanTask task, PlanTaskViewAssembler.Lookups lookups) {
        ExamPart part = task.getExamPartId() != null
                ? lookups.partsById().get(task.getExamPartId())
                : null;
        return part != null && part.getDisplayOrder() != null
                ? part.getDisplayOrder()
                : Integer.MAX_VALUE;
    }

    private int resolveReadinessScore(EnhancedResultDto result) {
        if (result.getReadinessScore() != 0) {
            return result.getReadinessScore();
        }
        return (int) Math.round(result.getPercentage());
    }

    private String stageLabel(PlanStage stage) {
        if (stage == null || stage == PlanStage.FOUNDATION) {
            return "Đang ôn từng Part từng tag.";
        }
        if (stage == PlanStage.MOCK) {
            return "Đã xong ải — làm mock kiểm tra readiness.";
        }
        return stage.name();
    }

    private Integer resolveTargetScore(
            String userId,
            String examTypeId,
            Integer requestTarget,
            Optional<UserTarget> userTargetOpt) {
        if (requestTarget != null) return requestTarget;
        return userTargetOpt.map(UserTarget::getTargetScore).orElse(null);
    }

    private String buildSummary(
            EnhancedResultDto result,
            Integer targetScore,
            int estimatedDays,
            int taskCount,
            List<String> partsWithoutTasks) {
        String target = targetScore == null ? "đạt mục tiêu" : "đạt " + targetScore + " điểm";
        int readiness = result.getReadinessScore() == 0
                ? (int) Math.round(result.getPercentage())
                : result.getReadinessScore();
        String base = String.format(
                "Readiness %d%%. %d ải cho Part chưa đạt mục tiêu — ~%d ngày, để %s.",
                readiness, taskCount, estimatedDays, target);
        if (partsWithoutTasks == null || partsWithoutTasks.isEmpty()) {
            return base;
        }
        return base + " Chưa tạo ải (thiếu tag trên câu): "
                + String.join(", ", partsWithoutTasks) + ".";
    }

    private LearningPlan requireOwnedPlan(String userId, String learningPlanId) {
        LearningPlan plan = planRepository.findById(learningPlanId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch học"));
        if (!Objects.equals(plan.getUserId(), userId)) {
            throw new ForbiddenException("Bạn không có quyền xem kế hoạch này");
        }
        return plan;
    }

    private BigDecimal round2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP);
    }

    private record TaskCandidate(
            String tagId,
            String examPartId,
            PlanTaskType taskType,
            int targetQuestionCount,
            double baselinePct,
            int passAccuracy,
            int wrongCount,
            int priorityScore
    ) {}
}
