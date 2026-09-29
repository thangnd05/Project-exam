package com.project_exam.backend.modules.assessment.learning.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.dto.EnhancedResultResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.PartBreakdownResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.TagBreakdownResponse;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.attempt.service.EnhancedResultService;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlan;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanSession;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.domain.PlanStage;
import com.project_exam.backend.modules.assessment.learning.domain.PlanTaskType;
import com.project_exam.backend.modules.assessment.learning.domain.TaskStatus;
import com.project_exam.backend.modules.assessment.learning.dto.GeneratePlanRequest;
import com.project_exam.backend.modules.assessment.learning.dto.GenerateSyllabusPlanRequest;
import com.project_exam.backend.modules.assessment.learning.dto.PlanResponse;
import com.project_exam.backend.modules.assessment.learning.mapper.LearningMapper;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanQuestionTargets;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanProgressSupport;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanTaskUnlockSupport;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanAccess;
import com.project_exam.backend.modules.assessment.learning.support.PlanTaskViewAssembler;
import com.project_exam.backend.modules.assessment.attempt.util.ReadinessThresholds;
import com.project_exam.backend.modules.assessment.target.service.UserTargetProgressService;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanRepository;
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
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningPlanService {

    /** Ngưỡng vượt ải khi người dùng chưa đặt mục tiêu cho Part đó. */
    private static final int DEFAULT_PASS_ACCURACY = 70;

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
    private final LearningMapper learningMapper;
    private final LearningPlanAccess planAccess;
    private final LearningPlanProgressSupport progressSupport;
    private final LearningPlanTaskUnlockSupport taskUnlockSupport;

    @Transactional
    public PlanResponse generatePlan(String userId, GeneratePlanRequest request) {
        Blueprint blueprint = prepareBlueprint(userId, request);
        if (blueprint.targetAchieved()) {
            closeActivePlans(userId, blueprint.examTypeId(), LearningPlan.Status.COMPLETED, null);
            return buildTargetAchievedResponse(userId, blueprint.examTypeId(), blueprint.result());
        }
        return createPlanFromBlueprint(
                userId, request.getUserTestId(), request.getDeadlineDays(), blueprint);
    }

    @Transactional
    public PlanResponse generateSyllabusPlan(String userId, GenerateSyllabusPlanRequest request) {
        Blueprint blueprint = prepareSyllabusBlueprint(userId, request);
        return createPlanFromBlueprint(userId, null, request.getDeadlineDays(), blueprint);
    }

    @Transactional
    public PlanResponse resyncPlan(String userId, String learningPlanId) {
        LearningPlan plan = planAccess.requireOwnedPlan(userId, learningPlanId);
        if (plan.getStatus() != LearningPlan.Status.ACTIVE) {
            throw new BadRequestException(
                    "Chỉ cập nhật được lộ trình đang chạy. Hãy đặt lộ trình này làm hiện tại trước.");
        }
        Blueprint blueprint = rebuildBlueprintFor(userId, plan);
        if (blueprint.targetAchieved()) {
            closeActivePlans(userId, blueprint.examTypeId(), LearningPlan.Status.COMPLETED, null);
            return buildTargetAchievedResponse(userId, blueprint.examTypeId(), blueprint.result());
        }

        PlanChanges changes = applyBlueprintInPlace(plan, blueprint);

        if (changes.added() > 0 || changes.reopened() > 0) {
            plan.setPlanStage(PlanStage.FOUNDATION);
            planRepository.save(plan);
        }

        progressSupport.healPlan(plan);

        List<LearningPlanTask> tasks =
                taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(plan.getLearningPlanId());
        PlanResponse response = buildPlanResponseFromEntity(
                plan,
                tasks,
                taskViewAssembler.lookupsFor(tasks),
                loadCurrentTargets(userId),
                loadDiagnosisSources(List.of(plan)));
        response.setReopenedTasks(changes.reopened());
        return response;
    }

    /** Dựng lại blueprint cho đúng nguồn của lộ trình: bài chẩn đoán cũ, hoặc chương trình học. */
    private Blueprint rebuildBlueprintFor(String userId, LearningPlan plan) {
        if (plan.getSourceUserTestId() == null) {
            GenerateSyllabusPlanRequest request = new GenerateSyllabusPlanRequest();
            request.setExamTypeId(plan.getExamTypeId());
            request.setDeadlineDays(plan.getDeadlineDays());
            return prepareSyllabusBlueprint(userId, request);
        }

        GeneratePlanRequest request = new GeneratePlanRequest();
        request.setUserTestId(plan.getSourceUserTestId());
        request.setDeadlineDays(plan.getDeadlineDays());
        return prepareBlueprint(userId, request);
    }

    private Blueprint prepareBlueprint(String userId, GeneratePlanRequest request) {
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

        EnhancedResultResponse result = enhancedResultService.getEnhancedResult(
                request.getUserTestId(), userId);
        List<PartBreakdownResponse> partBreakdown = result.getPartBreakdown();
        if (partBreakdown == null || partBreakdown.isEmpty()) {
            throw new BadRequestException("Bài thi không có dữ liệu phân tích phần, không thể sinh kế hoạch");
        }

        userTargetProgressService.syncPartScoresFromMock(
                userId, examTypeId, request.getUserTestId(), userTest.getFinishedAt(), result);

        if (userTargetProgressService.markTargetAchievedIfMet(userId, examTypeId, result)) {
            return Blueprint.targetAchieved(examTypeId, result);
        }

        UserTarget userTarget = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId)
                .orElseThrow(() -> new BadRequestException(
                        "Chưa đặt mục tiêu cho kỳ thi này. Hãy đặt mục tiêu trước khi sinh lộ trình."));
        Integer targetScore = resolveTargetScore(request.getTargetScore(), Optional.of(userTarget));
        Map<String, Integer> partRequirements = userTargetService.getEffectiveRequirements(userId, examTypeId);
        if (partRequirements.isEmpty()) {
            throw new BadRequestException(
                    "Mục tiêu chưa có ngưỡng % từng Part. Hãy đặt aim từng Part hoặc chọn mốc có cấu hình sẵn, rồi thử lại.");
        }

        Set<String> focusPartIds = request.getFocusExamPartIds() == null
                ? Set.of()
                : new HashSet<>(request.getFocusExamPartIds());

        Supplier<Map<String, List<String>>> questionIdsByPart =
                lazy(() -> buildQuestionIdsByPartForTest(userTest.getTestId()));

        List<TaskCandidate> candidates = buildTaskCandidates(
                partBreakdown, partRequirements, focusPartIds, questionIdsByPart);
        List<String> partsWithoutTasks = findPartsWithoutTasks(
                partBreakdown, focusPartIds, partRequirements, candidates);

        if (candidates.isEmpty()) {
            String detail = partsWithoutTasks.isEmpty()
                    ? "Các phần trong bài này đều đã đạt ngưỡng riêng  hãy làm một bài thi thử đầy đủ để nâng đều điểm."
                    : "Các phần cần cải thiện (" + String.join(", ", partsWithoutTasks)
                        + ") chưa có ải vì câu hỏi chưa được gắn tag. Gắn tag (admin) rồi sinh lại.";
            throw new BadRequestException("Chưa tạo được lộ trình từ bài này. " + detail);
        }

        return new Blueprint(
                false, examTypeId, result, userTarget, targetScore,
                partRequirements, candidates, partsWithoutTasks);
    }

    /**
     * Lộ trình cho người chưa làm bài nào: đi theo toàn bộ chương trình của kỳ thi
     * thay vì theo % đúng của một bài chẩn đoán.
     */
    private Blueprint prepareSyllabusBlueprint(String userId, GenerateSyllabusPlanRequest request) {
        String examTypeId = request.getExamTypeId();
        List<ExamPart> examParts = examPartRepository.findByExamTypeId(examTypeId);
        if (examParts.isEmpty()) {
            throw new BadRequestException(
                    "Kỳ thi này chưa có Part nào nên chưa sinh được lộ trình cho người mới.");
        }

        // Người mới chưa cần đặt mục tiêu: thiếu ngưỡng thì dùng mức sàn, đặt mục tiêu sau rồi resync.
        UserTarget userTarget = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId)
                .orElse(null);
        Integer targetScore = resolveTargetScore(
                request.getTargetScore(), Optional.ofNullable(userTarget));
        Map<String, Integer> partRequirements = userTargetService.getEffectiveRequirements(userId, examTypeId);

        Set<String> focusPartIds = request.getFocusExamPartIds() == null
                ? Set.of()
                : new HashSet<>(request.getFocusExamPartIds());

        List<TaskCandidate> candidates = new ArrayList<>();
        List<String> partsWithoutTasks = new ArrayList<>();
        for (ExamPart part : examParts) {
            if (!matchesFocus(part.getExamPartId(), focusPartIds)) {
                continue;
            }
            int passAccuracy = partRequirements.getOrDefault(
                    part.getExamPartId(), DEFAULT_PASS_ACCURACY);
            List<TaskCandidate> partTasks = collectTasksForPart(
                    part.getExamPartId(), null, passAccuracy, passAccuracy, Map::of);
            if (partTasks.isEmpty()) {
                partsWithoutTasks.add(part.getName() != null ? part.getName() : part.getExamPartId());
                continue;
            }
            candidates.addAll(partTasks);
        }

        if (candidates.isEmpty()) {
            throw new BadRequestException(
                    "Chưa tạo được lộ trình cho kỳ thi này: chưa có câu hỏi luyện tập nào được gắn tag. "
                            + "Thêm câu hỏi ở phạm vi luyện tập và gắn tag (admin) rồi thử lại.");
        }

        return Blueprint.syllabus(
                examTypeId, userTarget, targetScore, partRequirements, candidates, partsWithoutTasks);
    }

    private PlanResponse createPlanFromBlueprint(
            String userId, String sourceUserTestId, Integer deadlineDays, Blueprint blueprint) {
        String examTypeId = blueprint.examTypeId();
        int planSequence = (int) planRepository.countByUserIdAndExamTypeId(userId, examTypeId) + 1;

        LearningPlan plan = new LearningPlan();
        plan.setUserId(userId);
        plan.setExamTypeId(examTypeId);
        plan.setSourceUserTestId(sourceUserTestId);
        plan.setUserTargetId(userTargetIdOf(blueprint));
        plan.setTargetScore(blueprint.targetScore());
        plan.setDeadlineDays(deadlineDays);
        plan.setBaselineReadiness(
                blueprint.result() != null ? resolveReadinessScore(blueprint.result()) : null);
        plan.setPlanStage(PlanStage.FOUNDATION);
        plan.setPassAccuracyDefault(passAccuracyDefaultOf(blueprint));
        plan.setStatus(LearningPlan.Status.ACTIVE);
        plan.setPlanSequence(planSequence);
        plan.setPartsWithoutTasks(joinPartsWithoutTasks(blueprint.partsWithoutTasks()));
        plan = planRepository.save(plan);

        closeActivePlans(userId, examTypeId, LearningPlan.Status.REPLACED, plan.getLearningPlanId());

        List<LearningPlanTask> savedTasks = new ArrayList<>();
        int order = 1;
        for (TaskCandidate c : blueprint.candidates()) {
            savedTasks.add(newTaskFrom(plan.getLearningPlanId(), c, order++));
        }
        savedTasks = taskRepository.saveAll(savedTasks);
        taskUnlockSupport.reconcileLockedTasks(plan.getLearningPlanId());
        savedTasks = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(plan.getLearningPlanId());

        return buildPlanResponse(
                plan,
                savedTasks,
                blueprint.partsWithoutTasks(),
                taskViewAssembler.lookupsFor(savedTasks),
                diagnosisSourceOf(plan, loadDiagnosisSources(List.of(plan))));
    }

    private LearningPlanTask newTaskFrom(String learningPlanId, TaskCandidate c, int taskOrder) {
        LearningPlanTask task = new LearningPlanTask();
        task.setLearningPlanId(learningPlanId);
        task.setExamPartId(c.examPartId());
        task.setTaskType(c.taskType());
        task.setTargetQuestionCount(c.targetQuestionCount());
        task.setTaskOrder(taskOrder);
        task.setPassAccuracy(c.passAccuracy());
        task.setBaselineAccuracy(c.baselinePct() != null ? round2(c.baselinePct()) : null);
        task.setAttemptCount(0);
        task.setWrongCountAtDiagnosis(c.wrongCount());
        if (c.taskType() == PlanTaskType.TAG) {
            task.setTagId(c.tagId());
            task.setStatus(TaskStatus.ACTIVE);
        } else {
            task.setTagId(null);
            task.setStatus(TaskStatus.LOCKED);
        }
        return task;
    }

    private List<String> findPartsWithoutTasks(
            List<PartBreakdownResponse> partBreakdown,
            Set<String> focusPartIds,
            Map<String, Integer> partRequirements,
            List<TaskCandidate> candidates) {
        Set<String> partsWithTasks = candidates.stream()
                .map(TaskCandidate::examPartId)
                .collect(Collectors.toSet());
        return partBreakdown.stream()
                .filter(p -> matchesFocus(p.getExamPartId(), focusPartIds))
                .filter(p -> partNeedsFocus(p, requirePartThreshold(p, partRequirements)))
                .filter(p -> !partsWithTasks.contains(p.getExamPartId()))
                .map(PartBreakdownResponse::getPartName)
                .toList();
    }

    @Transactional
    public PlanResponse getPlan(String userId, String learningPlanId) {
        LearningPlan plan = planAccess.requireOwnedPlan(userId, learningPlanId);
        progressSupport.healPlan(plan);
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
        LearningPlan plan = planAccess.requireOwnedPlan(userId, learningPlanId);
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
        LearningPlan plan = planAccess.requireOwnedPlan(userId, learningPlanId);
        // Xoá mềm: session/task chỉ truy cập qua plan nên giữ nguyên để khôi phục được.
        planRepository.delete(plan);
    }

    private List<TaskCandidate> buildTaskCandidates(
            List<PartBreakdownResponse> partBreakdown,
            Map<String, Integer> partRequirements,
            Set<String> focusPartIds,
            Supplier<Map<String, List<String>>> questionIdsByPart) {
        List<TaskCandidate> candidates = new ArrayList<>();
        for (PartBreakdownResponse part : partBreakdown) {
            if (!matchesFocus(part.getExamPartId(), focusPartIds)) {
                continue;
            }
            int requiredPercent = requirePartThreshold(part, partRequirements);
            if (!partNeedsFocus(part, requiredPercent)) {
                continue;
            }

            List<TaskCandidate> partTasks = collectTasksForPart(
                    part.getExamPartId(), part, requiredPercent, requiredPercent, questionIdsByPart);
            candidates.addAll(partTasks);
        }
        return candidates;
    }

    private int requirePartThreshold(PartBreakdownResponse part, Map<String, Integer> partRequirements) {
        return requirePartThreshold(
                part.getExamPartId(), part.getPartName(), partRequirements);
    }

    private int requirePartThreshold(
            String examPartId, String partName, Map<String, Integer> partRequirements) {
        Integer required = partRequirements.get(examPartId);
        if (required == null) {
            throw new BadRequestException(
                    "Thiếu ngưỡng % cho Part \""
                            + (partName != null ? partName : examPartId)
                            + "\". Cập nhật mục tiêu (aim từng Part / mốc) rồi thử lại.");
        }
        return required;
    }

    private boolean partNeedsFocus(PartBreakdownResponse part, int requiredPercent) {
        return part.getPercentage() < requiredPercent;
    }

    private static <T> Supplier<T> lazy(Supplier<T> loader) {
        return new Supplier<>() {
            private T value;

            @Override
            public T get() {
                if (value == null) {
                    value = loader.get();
                }
                return value;
            }
        };
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

    /**
     * Gom ải cho một Part. {@code breakdown} null nghĩa là chưa có bài chẩn đoán nên đi theo
     * chương trình học; lúc đó {@code threshold} và {@code questionIdsByPart} không dùng tới.
     */
    private List<TaskCandidate> collectTasksForPart(
            String examPartId,
            PartBreakdownResponse breakdown,
            double threshold,
            int passAccuracy,
            Supplier<Map<String, List<String>>> questionIdsByPart) {
        List<TaskCandidate> partTasks = new ArrayList<>();
        Set<String> usedTagIds = new HashSet<>();

        if (breakdown == null) {
            // Chỉ lấy tag thật sự có câu luyện, tránh sinh ải mà phiên học không rút được câu nào.
            List<String> tagIds = questionTagRepository.findDistinctTagIdsByExamPartIdAndUsageScopeIn(
                    examPartId, Question.UsageScope.FOR_PRACTICE);
            for (String tagId : tagIds) {
                addTaskIfNew(partTasks, usedTagIds, new TaskCandidate(
                        tagId,
                        examPartId,
                        PlanTaskType.TAG,
                        LearningPlanQuestionTargets.TAG_TARGET,
                        null,
                        passAccuracy,
                        null));
            }
            if (partTasks.isEmpty()) {
                return List.of();
            }
        } else {
            collectDiagnosedTagTasks(
                    partTasks, usedTagIds, breakdown, threshold, passAccuracy, questionIdsByPart);
        }

        Map<String, Integer> sortOrderByTag = loadTagSortOrders(partTasks);
        partTasks.sort(Comparator.comparingInt(t -> tagSortRank(sortOrderByTag.get(t.tagId()))));

        ExamPart examPart = examPartRepository.findById(examPartId).orElse(null);
        int capstoneTarget = LearningPlanQuestionTargets.resolveCapstoneTarget(examPart);
        Double capstoneBaseline = breakdown != null ? breakdown.getPercentage() : null;
        Integer capstoneWrong = breakdown != null ? breakdown.getWrong() : null;
        partTasks.add(capstoneCandidate(
                examPartId, PlanTaskType.PART_CAPSTONE_1, capstoneTarget,
                capstoneBaseline, passAccuracy, capstoneWrong));
        partTasks.add(capstoneCandidate(
                examPartId, PlanTaskType.PART_CAPSTONE_2, capstoneTarget,
                capstoneBaseline, passAccuracy, capstoneWrong));
        return partTasks;
    }

    private void collectDiagnosedTagTasks(
            List<TaskCandidate> partTasks,
            Set<String> usedTagIds,
            PartBreakdownResponse part,
            double threshold,
            int passAccuracy,
            Supplier<Map<String, List<String>>> questionIdsByPart) {
        if (part.getTags() != null) {
            for (TagBreakdownResponse tag : part.getTags()) {
                if (tag.getTagId() == null || tag.getPercentage() >= threshold) {
                    continue;
                }
                addTaskIfNew(partTasks, usedTagIds,
                        buildTaskCandidate(tag.getTagId(), tag, part, passAccuracy));
            }
        }

        if (partTasks.isEmpty() && part.getTags() != null) {
            part.getTags().stream()
                    .filter(t -> t.getTagId() != null)
                    .forEach(tag -> addTaskIfNew(partTasks, usedTagIds,
                            buildTaskCandidate(tag.getTagId(), tag, part, passAccuracy)));
        }

        if (partTasks.isEmpty()) {
            List<String> questionIdsInPart = questionIdsByPart.get()
                    .getOrDefault(part.getExamPartId(), List.of());
            if (!questionIdsInPart.isEmpty()) {
                List<String> tagIds = questionTagRepository.findDistinctTagIdsByQuestionIdIn(questionIdsInPart);
                for (String tagId : tagIds) {
                    addTaskIfNew(partTasks, usedTagIds,
                            buildTaskCandidate(tagId, null, part, passAccuracy));
                }
            }
        }

        if (partTasks.isEmpty()) {
            String fallbackTagId = resolveTagIdForExamPart(part.getExamPartId());
            if (fallbackTagId != null) {
                addTaskIfNew(partTasks, usedTagIds,
                        buildTaskCandidate(fallbackTagId, null, part, passAccuracy));
            }
        }
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
            String tagId,
            TagBreakdownResponse tag,
            PartBreakdownResponse part,
            int passAccuracy) {
        int wrong = tag != null ? tag.getWrong() : part.getWrong();
        double baseline = tag != null ? tag.getPercentage() : part.getPercentage();
        return new TaskCandidate(
                tagId,
                part.getExamPartId(),
                PlanTaskType.TAG,
                LearningPlanQuestionTargets.TAG_TARGET,
                baseline,
                passAccuracy,
                wrong);
    }

    private TaskCandidate capstoneCandidate(
            String examPartId,
            PlanTaskType capstoneType,
            int targetQuestionCount,
            Double baselinePct,
            int passAccuracy,
            Integer wrongCount) {
        return new TaskCandidate(
                null,
                examPartId,
                capstoneType,
                targetQuestionCount,
                baselinePct,
                passAccuracy,
                wrongCount);
    }

    private void addTaskIfNew(
            List<TaskCandidate> partTasks,
            Set<String> usedTagIds,
            TaskCandidate candidate) {
        if (usedTagIds.add(candidate.tagId())) {
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

    private static String userTargetIdOf(Blueprint blueprint) {
        return blueprint.userTarget() != null ? blueprint.userTarget().getUserTargetId() : null;
    }

    private static int passAccuracyDefaultOf(Blueprint blueprint) {
        Map<String, Integer> partRequirements = blueprint.partRequirements();
        return partRequirements.isEmpty()
                ? DEFAULT_PASS_ACCURACY
                : Collections.min(partRequirements.values());
    }

    private PlanChanges applyBlueprintInPlace(LearningPlan plan, Blueprint blueprint) {
        plan.setUserTargetId(userTargetIdOf(blueprint));
        plan.setTargetScore(blueprint.targetScore());
        plan.setPassAccuracyDefault(passAccuracyDefaultOf(blueprint));
        plan.setPartsWithoutTasks(joinPartsWithoutTasks(blueprint.partsWithoutTasks()));
        planRepository.save(plan);

        String planId = plan.getLearningPlanId();
        List<LearningPlanTask> existing = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(planId);
        Map<String, LearningPlanTask> existingByKey = existing.stream()
                .collect(Collectors.toMap(LearningPlanService::taskKey, t -> t, (a, b) -> a));

        int added = 0;
        int reopened = 0;
        int order = 1;
        Set<String> wantedKeys = new LinkedHashSet<>();
        List<LearningPlanTask> toSave = new ArrayList<>();
        for (TaskCandidate c : blueprint.candidates()) {
            String key = candidateKey(c);
            if (!wantedKeys.add(key)) {
                continue;
            }
            LearningPlanTask task = existingByKey.get(key);
            if (task == null) {
                task = newTaskFrom(planId, c, order++);
                added++;
            } else {

                task.setPassAccuracy(c.passAccuracy());
                task.setTargetQuestionCount(c.targetQuestionCount());
                task.setTaskOrder(order++);
                if (task.getStatus() == TaskStatus.PASSED
                        && !meetsAccuracy(task.getBestAccuracy(), c.passAccuracy())) {
                    task.setStatus(TaskStatus.ACTIVE);
                    task.setPassedAt(null);
                    reopened++;
                }
            }
            toSave.add(task);
        }

        List<LearningPlanTask> obsolete = existing.stream()
                .filter(t -> !wantedKeys.contains(taskKey(t)))
                .toList();
        List<LearningPlanTask> toDelete = new ArrayList<>();
        Set<String> taskIdsWithSessions = taskIdsWithSessions(planId);
        for (LearningPlanTask task : obsolete) {
            if (!hasProgress(task) && !taskIdsWithSessions.contains(task.getTaskId())) {
                toDelete.add(task);
                continue;
            }

            task.setTaskOrder(order++);
            if (!LearningPlanTaskUnlockSupport.isCleared(task)) {
                task.setStatus(TaskStatus.SKIPPED);
            }
            toSave.add(task);
        }

        taskRepository.saveAll(toSave);
        if (!toDelete.isEmpty()) {
            taskRepository.deleteAll(toDelete);
        }
        return new PlanChanges(added, reopened);
    }

    private Set<String> taskIdsWithSessions(String learningPlanId) {
        return sessionRepository.findByLearningPlanId(learningPlanId).stream()
                .map(LearningPlanSession::getTaskId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private static boolean hasProgress(LearningPlanTask task) {
        return LearningPlanTaskUnlockSupport.isCleared(task)
                || (task.getAttemptCount() != null && task.getAttemptCount() > 0);
    }

    private static boolean meetsAccuracy(BigDecimal bestAccuracy, Integer passAccuracy) {
        if (bestAccuracy == null) {
            return false;
        }
        return bestAccuracy.compareTo(BigDecimal.valueOf(passAccuracy != null ? passAccuracy : 0)) >= 0;
    }

    private static String taskKey(LearningPlanTask task) {
        return buildTaskKey(task.getExamPartId(), task.getTaskType(), task.getTagId());
    }

    private static String candidateKey(TaskCandidate candidate) {
        return buildTaskKey(
                candidate.examPartId(),
                candidate.taskType(),
                candidate.taskType() == PlanTaskType.TAG ? candidate.tagId() : null);
    }

    private static String buildTaskKey(String examPartId, PlanTaskType taskType, String tagId) {
        return examPartId + "|" + taskType + "|" + (tagId != null ? tagId : "");
    }

    private record Blueprint(
            boolean targetAchieved,
            String examTypeId,
            EnhancedResultResponse result,
            UserTarget userTarget,
            Integer targetScore,
            Map<String, Integer> partRequirements,
            List<TaskCandidate> candidates,
            List<String> partsWithoutTasks) {

        static Blueprint targetAchieved(String examTypeId, EnhancedResultResponse result) {
            return new Blueprint(true, examTypeId, result, null, null, Map.of(), List.of(), List.of());
        }

        static Blueprint syllabus(
                String examTypeId,
                UserTarget userTarget,
                Integer targetScore,
                Map<String, Integer> partRequirements,
                List<TaskCandidate> candidates,
                List<String> partsWithoutTasks) {
            return new Blueprint(
                    false, examTypeId, null, userTarget, targetScore,
                    partRequirements, candidates, partsWithoutTasks);
        }
    }

    private record PlanChanges(int added, int reopened) {}

    private PlanResponse buildPlanResponse(
            LearningPlan plan,
            List<LearningPlanTask> tasks,
            List<String> partsWithoutTasks,
            PlanTaskViewAssembler.Lookups lookups,
            DiagnosisSource diagnosisSource) {
        long cleared = tasks.stream().filter(LearningPlanTaskUnlockSupport::isCleared).count();

        PlanResponse response = learningMapper.toGeneratedPlanResponse(
                plan,
                ReadinessThresholds.levelFromScore(plan.getBaselineReadiness()),
                plan.getPlanStage().name(),
                tasks.size(),
                (int) cleared,
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
        long cleared = tasks.stream().filter(LearningPlanTaskUnlockSupport::isCleared).count();

        PlanResponse response = learningMapper.toPlanResponseFromEntity(
                plan,
                ReadinessThresholds.levelFromScore(plan.getBaselineReadiness()),
                plan.getPlanStage() != null ? plan.getPlanStage().name() : PlanStage.FOUNDATION.name(),
                tasks.size(),
                (int) cleared,
                taskViewAssembler.buildPartGroups(tasks, lookups));
        response.setRecommendedTaskId(pickRecommendedTaskId(tasks, lookups));
        response.setTargetOutdated(isTargetOutdated(plan, currentTargets.get(plan.getExamTypeId())));
        applyDiagnosisSource(response, diagnosisSourceOf(plan, diagnosisSources));
        response.setPartsWithoutTasks(splitPartsWithoutTasks(plan.getPartsWithoutTasks()));
        return response;
    }

    private DiagnosisSource diagnosisSourceOf(
            LearningPlan plan, Map<String, DiagnosisSource> diagnosisSources) {
        String sourceUserTestId = plan.getSourceUserTestId();
        return sourceUserTestId != null ? diagnosisSources.get(sourceUserTestId) : null;
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
            String userId, String examTypeId, EnhancedResultResponse result) {
        int readiness = resolveReadinessScore(result);
        return learningMapper.toTargetAchievedResponse(
                userId,
                examTypeId,
                readiness,
                ReadinessThresholds.levelFromScore(readiness));
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

    private int resolveReadinessScore(EnhancedResultResponse result) {
        if (result.getReadinessScore() != 0) {
            return result.getReadinessScore();
        }
        return (int) Math.round(result.getPercentage());
    }

    private Integer resolveTargetScore(
            Integer requestTarget,
            Optional<UserTarget> userTargetOpt) {
        if (requestTarget != null) return requestTarget;
        return userTargetOpt.map(UserTarget::getTargetScore).orElse(null);
    }

    private BigDecimal round2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP);
    }

    private record TaskCandidate(
            String tagId,
            String examPartId,
            PlanTaskType taskType,
            int targetQuestionCount,
            Double baselinePct,
            int passAccuracy,
            Integer wrongCount
    ) {}
}
