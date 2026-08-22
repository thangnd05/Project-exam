package com.project_exam.backend.modules.assessment.learning.service;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.util.AnswerGradingUtil;
import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.PassageMapper;
import com.project_exam.backend.modules.assessment.exam.mapper.PassageMediaMapper;
import com.project_exam.backend.modules.assessment.exam.repository.AnswerRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.PassageMediaRepository;
import com.project_exam.backend.modules.assessment.exam.repository.PassageRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.RecoveryResourceRepository;
import com.project_exam.backend.modules.assessment.exam.service.AnswerService;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlan;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanSession;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanSessionAnswer;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanSessionQuestion;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.domain.PlanStage;
import com.project_exam.backend.modules.assessment.learning.domain.PlanTaskType;
import com.project_exam.backend.modules.assessment.learning.domain.SessionStatus;
import com.project_exam.backend.modules.assessment.learning.domain.TaskStatus;
import com.project_exam.backend.modules.assessment.learning.domain.UserQuestionExposure;
import com.project_exam.backend.modules.assessment.learning.dto.CurrentSessionResponse;
import com.project_exam.backend.modules.assessment.learning.dto.PlanTaskResponse;
import com.project_exam.backend.modules.assessment.learning.dto.RecommendedResourceResponse;
import com.project_exam.backend.modules.assessment.learning.dto.SubmitSessionRequest;
import com.project_exam.backend.modules.assessment.learning.dto.SubmitSessionResponse;
import com.project_exam.backend.modules.assessment.learning.dto.TaskSessionHistoryResponse;
import com.project_exam.backend.modules.assessment.learning.mapper.LearningMapper;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanRepository;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanSessionAnswerRepository;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanSessionQuestionRepository;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanSessionRepository;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanTaskRepository;
import com.project_exam.backend.modules.assessment.learning.repository.UserQuestionExposureRepository;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanQuestionTargets;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanProgressSupport;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanTaskUnlockSupport;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanAccess;
import com.project_exam.backend.modules.assessment.learning.support.PlanTaskViewAssembler;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import com.project_exam.backend.modules.gamification.streak.domain.StreakActivityType;
import com.project_exam.backend.modules.gamification.streak.service.StreakService;
import com.project_exam.backend.shared.util.AfterCommitTasks;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningPlanSessionService {

    private final LearningPlanRepository planRepository;
    private final LearningPlanTaskRepository taskRepository;
    private final LearningPlanSessionRepository sessionRepository;
    private final LearningPlanSessionQuestionRepository sessionQuestionRepository;
    private final LearningPlanSessionAnswerRepository sessionAnswerRepository;
    private final UserQuestionExposureRepository exposureRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final AnswerService answerService;
    private final PassageRepository passageRepository;
    private final PassageMediaRepository passageMediaRepository;
    private final PassageMapper passageMapper;
    private final PassageMediaMapper passageMediaMapper;
    private final ExamPartRepository examPartRepository;
    private final RecoveryResourceRepository recoveryResourceRepository;
    private final LearningPlanResourceLookup resourceLookup;
    private final PlanTaskViewAssembler taskViewAssembler;
    private final LearningPlanProgressSupport progressSupport;
    private final StreakService streakService;
    private final LearningMapper learningMapper;
    private final LearningPlanAccess planAccess;

    @Transactional(readOnly = true)
    public CurrentSessionResponse getCurrentSession(
            String userId, String learningPlanId, String taskId, boolean includeReview) {
        LearningPlan plan = planAccess.requireOwnedPlan(userId, learningPlanId);
        PlanStage stage = effectiveStage(plan);

        if (taskId == null || taskId.isBlank()) {
            return stage == PlanStage.MOCK
                    ? buildMockStageResponse(plan)
                    : buildPickResponse(plan, stage);
        }

        LearningPlanTask task = requireTaskOfPlan(learningPlanId, taskId);

        if (includeReview) {
            return buildReviewResponse(plan, task);
        }

        return sessionRepository
                .findFirstByLearningPlanIdAndTaskIdAndStatusOrderByStartedAtDesc(
                        learningPlanId, taskId, SessionStatus.IN_PROGRESS)
                .map(session -> buildSessionResponse(plan, stage, session))
                .orElseGet(() -> stage == PlanStage.MOCK
                        ? buildMockStageResponse(plan)
                        : buildPickResponse(plan, stage));
    }

    @Transactional
    public CurrentSessionResponse startTaskSession(String userId, String learningPlanId, String taskId) {
        LearningPlan plan = planAccess.requireOwnedPlan(userId, learningPlanId);
        progressSupport.healPlan(plan);
        PlanStage stage = effectiveStage(plan);

        if (taskId == null || taskId.isBlank()) {
            return stage == PlanStage.MOCK
                    ? buildMockStageResponse(plan)
                    : buildPickResponse(plan, stage);
        }

        LearningPlanTask task = requireTaskOfPlan(learningPlanId, taskId);
        if (task.getStatus() == TaskStatus.SKIPPED) {
            throw new BadRequestException("Ải này đã bỏ qua, không thể học.");
        }
        if (task.getStatus() == TaskStatus.LOCKED) {
            throw new BadRequestException(lockedTaskMessage(task));
        }

        abandonOtherInProgressSessions(learningPlanId, taskId);

        Optional<LearningPlanSession> inProgress = sessionRepository
                .findFirstByLearningPlanIdAndTaskIdAndStatusOrderByStartedAtDesc(
                        learningPlanId, taskId, SessionStatus.IN_PROGRESS);
        if (inProgress.isPresent()) {
            return buildSessionResponse(plan, stage, inProgress.get());
        }

        List<String> questionIds = pickQuestionsForTask(plan, task);
        if (questionIds.isEmpty()) {
            boolean skipped = skipEmptyPoolTask(plan, task);
            if (plan.getPlanStage() == PlanStage.MOCK) {
                return buildMockStageResponse(plan);
            }

            CurrentSessionResponse response = buildPickResponse(plan, plan.getPlanStage());
            response.setNoticeCode(skipped ? "EMPTY_POOL_SKIPPED" : "EMPTY_POOL_RETRY");
            return response;
        }

        LearningPlanSession session = createQuizSession(plan, task, questionIds);
        return buildSessionResponse(plan, stage, session);
    }

    private LearningPlanTask requireTaskOfPlan(String learningPlanId, String taskId) {
        LearningPlanTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhiệm vụ"));
        if (!Objects.equals(task.getLearningPlanId(), learningPlanId)) {
            throw new ForbiddenException("Nhiệm vụ không thuộc kế hoạch này");
        }
        return task;
    }

    private boolean skipEmptyPoolTask(LearningPlan plan, LearningPlanTask task) {
        if (LearningPlanTaskUnlockSupport.isCleared(task)) {
            return false;
        }
        task.setStatus(TaskStatus.SKIPPED);
        taskRepository.save(task);
        progressSupport.afterTaskCleared(plan, task);
        return true;
    }

    private CurrentSessionResponse buildReviewResponse(LearningPlan plan, LearningPlanTask task) {
        List<LearningPlanSession> sessions = sessionRepository
                .findByLearningPlanIdAndTaskIdOrderByStartedAtDesc(
                        plan.getLearningPlanId(), task.getTaskId());

        LearningPlanSession lastSubmitted = sessions.stream()
                .filter(s -> s.getStatus() == SessionStatus.SUBMITTED)
                .filter(s -> !Boolean.TRUE.equals(s.getAbandoned()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Chưa có phiên học nào được nộp cho ải này."));

        return buildReviewResponse(plan, lastSubmitted);
    }

    private CurrentSessionResponse buildReviewResponse(LearningPlan plan, LearningPlanSession session) {
        List<LearningPlanSessionQuestion> sessionQuestions =
                sessionQuestionRepository.findBySessionIdOrderByDisplayOrderAsc(session.getSessionId());
        List<String> questionIds = sessionQuestions.stream()
                .map(LearningPlanSessionQuestion::getQuestionId)
                .toList();
        Map<String, List<Answer>> correctByQuestion = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));
        List<LearningPlanSessionAnswer> userAnswerRows =
                sessionAnswerRepository.findBySessionId(session.getSessionId());

        List<SubmitSessionResponse.ReviewItem> reviewItems =
                buildReviewItems(sessionQuestions, userAnswerRows, correctByQuestion);

        int total = sessionQuestions.size();
        int accuracy = session.getAccuracy() != null ? session.getAccuracy() : 0;
        int correct = (int) reviewItems.stream()
                .filter(SubmitSessionResponse.ReviewItem::isCorrect)
                .count();
        boolean passed = Boolean.TRUE.equals(session.getPassed());

        return learningMapper.toReviewResponse(
                plan,
                session,
                correct,
                total,
                accuracy,
                passed,
                reviewItems);
    }

    @Transactional(readOnly = true)
    public CurrentSessionResponse getSessionReview(
            String userId, String learningPlanId, String sessionId) {
        LearningPlan plan = planAccess.requireOwnedPlan(userId, learningPlanId);

        LearningPlanSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiên luyện"));
        if (!Objects.equals(session.getLearningPlanId(), learningPlanId)) {
            throw new ForbiddenException("Phiên luyện không thuộc kế hoạch này");
        }
        if (session.getStatus() != SessionStatus.SUBMITTED) {
            throw new BadRequestException("Phiên này chưa nộp nên chưa có bài làm để xem.");
        }

        return buildReviewResponse(plan, session);
    }

    private String lockedTaskMessage(LearningPlanTask task) {
        PlanTaskType type = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;
        if (type == PlanTaskType.PART_CAPSTONE_2) {
            return "Hoàn thành ải tổng ôn lần 1 trước khi mở lần 2.";
        }
        return "Hoàn thành tất cả ải tag của Part này trước khi mở ải tổng ôn.";
    }

    /** Trạm hiện tại của plan; cột NOT NULL nên chỉ null-safe cho dữ liệu cũ. */
    private PlanStage effectiveStage(LearningPlan plan) {
        return plan.getPlanStage() != null ? plan.getPlanStage() : PlanStage.FOUNDATION;
    }

    @Transactional
    public SubmitSessionResponse submitSession(
            String userId,
            String learningPlanId,
            String sessionId,
            SubmitSessionRequest request) {
        LearningPlan plan = planAccess.requireOwnedPlan(userId, learningPlanId);
        LearningPlanSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiên học"));
        if (!Objects.equals(session.getLearningPlanId(), learningPlanId)) {
            throw new ForbiddenException("Phiên học không thuộc kế hoạch này");
        }
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BadRequestException("Phiên học đã được nộp");
        }

        List<LearningPlanSessionQuestion> sessionQuestions =
                sessionQuestionRepository.findBySessionIdOrderByDisplayOrderAsc(sessionId);
        Set<String> allowedQuestionIds = sessionQuestions.stream()
                .map(LearningPlanSessionQuestion::getQuestionId)
                .collect(Collectors.toSet());

        Map<String, List<Answer>> correctByQuestion = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(allowedQuestionIds))
                .stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        Map<String, Question> questionMap = questionRepository.findAllById(allowedQuestionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q, (a, b) -> a));

        Map<String, SubmitSessionRequest.AnswerItem> uniqueAnswers = new LinkedHashMap<>();
        for (SubmitSessionRequest.AnswerItem item : request.getAnswers()) {
            uniqueAnswers.putIfAbsent(item.getQuestionId(), item);
        }

        int correct = 0;
        List<LearningPlanSessionAnswer> rows = new ArrayList<>();
        for (SubmitSessionRequest.AnswerItem item : uniqueAnswers.values()) {
            if (!allowedQuestionIds.contains(item.getQuestionId())) {
                throw new BadRequestException("Câu hỏi không thuộc phiên học hiện tại");
            }
            Question question = questionMap.get(item.getQuestionId());
            List<Answer> correctAnswers = correctByQuestion.get(item.getQuestionId());
            String selectedIdsCsv = AnswerGradingUtil.toCsv(item.getSelectedAnswerIds());
            boolean isCorrect = question != null
                    && AnswerGradingUtil.isCorrect(question.getQuestionType(),
                            item.getSelectedAnswerId(), selectedIdsCsv, null, correctAnswers);
            if (isCorrect) correct++;

            LearningPlanSessionAnswer row = new LearningPlanSessionAnswer();
            row.setSessionId(sessionId);
            row.setQuestionId(item.getQuestionId());
            row.setSelectedAnswerId(item.getSelectedAnswerId());
            row.setSelectedAnswerIds(selectedIdsCsv);
            row.setIsCorrect(isCorrect);
            rows.add(row);

        }
        sessionAnswerRepository.saveAll(rows);

        int total = sessionQuestions.size();
        int accuracy = total > 0 ? (int) Math.round((double) correct / total * 100) : 0;
        int passRequired = resolvePassAccuracy(plan, session);
        boolean passed = accuracy >= passRequired;

        session.setStatus(SessionStatus.SUBMITTED);
        session.setAccuracy(accuracy);
        session.setPassed(passed);
        session.setSubmittedAt(Instant.now());
        sessionRepository.save(session);

        if (passed) {
            AfterCommitTasks.runQuietly(
                    () -> streakService.recordActivity(userId, StreakActivityType.LESSON_PASS));
        }

        String taskStatus = null;
        if (session.getTaskId() != null) {
            LearningPlanTask task = taskRepository.findById(session.getTaskId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy nhiệm vụ"));
            task.setAttemptCount(task.getAttemptCount() + 1);
            if (task.getBestAccuracy() == null
                    || accuracy > task.getBestAccuracy().intValue()) {
                task.setBestAccuracy(java.math.BigDecimal.valueOf(accuracy));
            }

            boolean taskPassed = passed || task.getStatus() == TaskStatus.PASSED;
            if (taskPassed) {
                task.setStatus(TaskStatus.PASSED);
                if (task.getPassedAt() == null) {
                    task.setPassedAt(Instant.now());
                }
                taskStatus = TaskStatus.PASSED.name();
            } else {
                task.setStatus(TaskStatus.ACTIVE);
                taskStatus = TaskStatus.ACTIVE.name();
            }
            taskRepository.save(task);
            if (passed) {
                progressSupport.afterTaskCleared(plan, task);
            } else {
                progressSupport.maybeAdvanceToMock(plan);
            }
        }

        List<SubmitSessionResponse.ReviewItem> reviewItems =
                buildReviewItems(sessionQuestions, rows, correctByQuestion);

        return learningMapper.toSubmitSessionResponse(
                sessionId,
                correct,
                total,
                accuracy,
                passed,
                taskStatus,
                effectiveStage(plan).name(),
                reviewItems);
    }

    private List<SubmitSessionResponse.ReviewItem> buildReviewItems(
            List<LearningPlanSessionQuestion> sessionQuestions,
            List<LearningPlanSessionAnswer> userAnswerRows,
            Map<String, List<Answer>> correctByQuestion) {

        List<String> questionIds = sessionQuestions.stream()
                .map(LearningPlanSessionQuestion::getQuestionId)
                .toList();
        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q, (a, b) -> a));
        Map<String, List<Answer>> allAnswers = answerRepository
                .findByQuestionIdIn(new ArrayList<>(questionIds)).stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));
        Map<String, LearningPlanSessionAnswer> userAnswerMap = userAnswerRows.stream()
                .collect(Collectors.toMap(LearningPlanSessionAnswer::getQuestionId, a -> a, (a, b) -> a));

        List<SubmitSessionResponse.ReviewItem> items = new ArrayList<>();
        for (LearningPlanSessionQuestion sq : sessionQuestions) {
            String qid = sq.getQuestionId();
            Question q = questionMap.get(qid);
            if (q == null) continue;

            LearningPlanSessionAnswer userAns = userAnswerMap.get(qid);
            List<Answer> correctList = correctByQuestion.getOrDefault(qid, List.of());
            List<Answer> answerList = allAnswers.getOrDefault(qid, List.of());

            List<SubmitSessionResponse.ReviewAnswer> reviewAnswers = answerList.stream()
                    .map(learningMapper::toReviewAnswer)
                    .toList();

            List<String> selectedIds = userAns == null ? List.of()
                    : (userAns.getSelectedAnswerIds() != null
                        ? List.copyOf(AnswerGradingUtil.parseIds(userAns.getSelectedAnswerIds()))
                        : (userAns.getSelectedAnswerId() != null ? List.of(userAns.getSelectedAnswerId()) : List.of()));

            items.add(learningMapper.toReviewItem(
                    q,
                    reviewAnswers,
                    userAns != null ? userAns.getSelectedAnswerId() : null,
                    selectedIds,
                    correctList.isEmpty() ? null : correctList.get(0).getAnswerId(),
                    userAns != null && Boolean.TRUE.equals(userAns.getIsCorrect())));
        }
        return items;
    }

    @Transactional(readOnly = true)
    public List<TaskSessionHistoryResponse> getTaskSessionHistory(
            String userId, String learningPlanId, String taskId) {
        planAccess.requireOwnedPlan(userId, learningPlanId);

        LearningPlanTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhiệm vụ"));
        if (!Objects.equals(task.getLearningPlanId(), learningPlanId)) {
            throw new ForbiddenException("Nhiệm vụ không thuộc kế hoạch này");
        }

        List<LearningPlanSession> sessions = sessionRepository
                .findByLearningPlanIdAndTaskIdOrderByStartedAtDesc(learningPlanId, taskId);

        return sessions.stream()
                .filter(s -> !Boolean.TRUE.equals(s.getAbandoned()))
                .map(learningMapper::toTaskSessionHistory)
                .toList();
    }

    private void abandonOtherInProgressSessions(String learningPlanId, String keepTaskId) {
        List<LearningPlanSession> sessions = sessionRepository.findByLearningPlanIdAndStatus(
                learningPlanId, SessionStatus.IN_PROGRESS);
        for (LearningPlanSession session : sessions) {
            if (!Objects.equals(session.getTaskId(), keepTaskId)) {
                session.setStatus(SessionStatus.SUBMITTED);
                session.setPassed(false);
                session.setAccuracy(0);
                session.setAbandoned(true);
                session.setSubmittedAt(Instant.now());
                sessionRepository.save(session);
            }
        }
    }

    private int resolvePassAccuracy(LearningPlan plan, LearningPlanSession session) {
        if (session.getTaskId() != null) {
            Integer fromTask = taskRepository.findById(session.getTaskId())
                    .map(LearningPlanTask::getPassAccuracy)
                    .orElse(null);
            if (fromTask != null) {
                return fromTask;
            }
        }
        if (plan.getPassAccuracyDefault() != null) {
            return plan.getPassAccuracyDefault();
        }
        throw new BadRequestException("Thiếu ngưỡng vượt ải cho phiên luyện này.");
    }

    private List<String> pickQuestionsForTask(LearningPlan plan, LearningPlanTask task) {
        int targetCount = resolveTargetQuestionCount(task);
        PlanTaskType taskType = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;
        if (taskType == PlanTaskType.TAG) {
            return pickQuestionsForTag(
                    plan.getUserId(), task.getTagId(), task.getExamPartId(), targetCount);
        }
        return pickQuestionsForPart(plan.getUserId(), task.getExamPartId(), targetCount);
    }

    private LearningPlanSession createQuizSession(
            LearningPlan plan, LearningPlanTask task, List<String> questionIds) {
        PlanTaskType taskType = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;

        LearningPlanSession session = new LearningPlanSession();
        session.setLearningPlanId(plan.getLearningPlanId());
        session.setTaskId(task.getTaskId());
        session.setResourceId(taskType == PlanTaskType.TAG ? resolveResourceId(task.getTagId()) : null);
        session.setQuestionCount(questionIds.size());
        session.setStatus(SessionStatus.IN_PROGRESS);
        session = sessionRepository.save(session);

        saveSessionQuestions(session.getSessionId(), questionIds);
        recordExposures(plan.getUserId(), questionIds);
        return session;
    }

    private int resolveTargetQuestionCount(LearningPlanTask task) {
        PlanTaskType type = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;
        ExamPart part = type != PlanTaskType.TAG
                ? examPartRepository.findById(task.getExamPartId()).orElse(null)
                : null;
        return LearningPlanQuestionTargets.resolveTargetCount(
                task.getTargetQuestionCount(), type, part);
    }

    private void saveSessionQuestions(String sessionId, List<String> questionIds) {
        if (questionIds.isEmpty()) {
            return;
        }
        List<LearningPlanSessionQuestion> rows = new ArrayList<>(questionIds.size());
        int order = 1;
        for (String qid : questionIds) {
            LearningPlanSessionQuestion sq = new LearningPlanSessionQuestion();
            sq.setSessionId(sessionId);
            sq.setQuestionId(qid);
            sq.setDisplayOrder(order++);
            rows.add(sq);
        }
        sessionQuestionRepository.saveAll(rows);
    }

    private String resolveResourceId(String tagId) {
        return resourceLookup.findFirstByTagId(tagId)
                .map(RecommendedResourceResponse::getResourceId)
                .orElse(null);
    }

    private List<String> pickQuestionsForTag(
            String userId, String tagId, String examPartId, int count) {
        int poolSize = LearningPlanQuestionTargets.poolFetchSize(count);
        List<String> pool = questionRepository.findRandomQuestionIdsByTagAndExamPart(
                tagId, examPartId, poolSize);
        return selectFromPool(userId, pool, count);
    }

    private List<String> pickQuestionsForPart(String userId, String examPartId, int count) {
        int poolSize = LearningPlanQuestionTargets.poolFetchSize(count);
        List<String> pool = questionRepository.findRandomQuestionIdsByExamPartId(examPartId, poolSize);
        return selectFromPool(userId, pool, count);
    }

    private List<String> selectFromPool(String userId, List<String> pool, int count) {
        List<String> ids = pool.stream().distinct().toList();
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<String, Integer> timesSeenById = exposureRepository
                .findByUserIdAndQuestionIdIn(userId, ids).stream()
                .collect(Collectors.toMap(
                        UserQuestionExposure::getQuestionId,
                        e -> e.getTimesSeen() != null ? e.getTimesSeen() : 1,
                        (a, b) -> a));

        List<String> unseen = ids.stream()
                .filter(id -> !timesSeenById.containsKey(id))
                .limit(count)
                .toList();
        if (unseen.size() >= count) {
            return unseen;
        }

        List<String> fill = ids.stream()
                .filter(timesSeenById::containsKey)
                .sorted(Comparator.comparingInt(timesSeenById::get))
                .limit((long) count - unseen.size())
                .toList();

        List<String> result = new ArrayList<>(unseen);
        result.addAll(fill);
        return result;
    }

    private void recordExposures(String userId, List<String> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            return;
        }
        List<String> distinctIds = questionIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctIds.isEmpty()) {
            return;
        }
        Map<String, UserQuestionExposure> existing = exposureRepository
                .findByUserIdAndQuestionIdIn(userId, distinctIds).stream()
                .collect(Collectors.toMap(UserQuestionExposure::getQuestionId, e -> e, (a, b) -> a));

        Instant now = Instant.now();
        List<UserQuestionExposure> rows = new ArrayList<>();
        for (String questionId : distinctIds) {
            UserQuestionExposure e = existing.get(questionId);
            if (e == null) {
                e = new UserQuestionExposure();
                e.setUserId(userId);
                e.setQuestionId(questionId);
            } else {
                e.setTimesSeen(e.getTimesSeen() + 1);
                e.setLastSeenAt(now);
            }
            rows.add(e);
        }
        exposureRepository.saveAll(rows);
    }

    private CurrentSessionResponse buildSessionResponse(
            LearningPlan plan, PlanStage stage, LearningPlanSession session) {
        List<LearningPlanSessionQuestion> sqs =
                sessionQuestionRepository.findBySessionIdOrderByDisplayOrderAsc(session.getSessionId());
        List<String> questionIds = sqs.stream()
                .map(LearningPlanSessionQuestion::getQuestionId)
                .toList();

        List<Question> questions = questionRepository.findAllById(questionIds);
        Map<String, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));
        Map<String, List<AnswerResponse>> answersMap =
                answerService.getAnswersForMultipleQuestions(questionIds);
        Map<String, PassageResponse> passagesById = loadPassageDtos(questions);

        List<QuestionResponse> questionDtos = new ArrayList<>();
        for (String qid : questionIds) {
            Question q = questionMap.get(qid);
            if (q == null) continue;
            questionDtos.add(learningMapper.toQuestionResponse(
                    q,
                    q.getPassageId() != null ? passagesById.get(q.getPassageId()) : null,
                    answersMap.getOrDefault(qid, List.of())));
        }

        PlanTaskResponse activeTaskDto = null;
        if (session.getTaskId() != null) {
            Optional<LearningPlanTask> taskOpt = taskRepository.findById(session.getTaskId());
            if (taskOpt.isPresent()) {
                LearningPlanTask task = taskOpt.get();
                List<LearningPlanTask> singleTaskList = List.of(task);
                activeTaskDto = taskViewAssembler.toTaskDto(
                        task, taskViewAssembler.lookupsFor(singleTaskList));
            }
        }

        RecommendedResourceResponse resourceDto = null;
        if (session.getResourceId() != null) {
            resourceDto = recoveryResourceRepository.findById(session.getResourceId())
                    .map(this::toResourceDto)
                    .orElse(null);
        }

        long cleared = countClearedTasks(plan.getLearningPlanId());
        long total = taskRepository.countByLearningPlanId(plan.getLearningPlanId());

        return learningMapper.toQuizSessionResponse(
                plan,
                stage.name(),
                session,
                activeTaskDto,
                resourceDto,
                resolvePassAccuracy(plan, session),
                questionDtos,
                (int) total,
                (int) cleared);
    }

    /** Đoạn văn + media (audio/ảnh) kèm câu hỏi, để FE hiển thị được câu Reading/Listening. */
    private Map<String, PassageResponse> loadPassageDtos(List<Question> questions) {
        Set<String> passageIds = questions.stream()
                .map(Question::getPassageId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (passageIds.isEmpty()) {
            return Map.of();
        }

        Map<String, List<PassageMediaResponse>> mediaByPassageId = passageMediaRepository
                .findByPassageIdInOrderByIdAsc(passageIds).stream()
                .map(passageMediaMapper::toResponse)
                .collect(Collectors.groupingBy(PassageMediaResponse::getPassageId));

        return passageRepository.findAllById(passageIds).stream()
                .collect(Collectors.toMap(
                        p -> p.getPassageId(),
                        p -> passageMapper.toResponse(
                                p,
                                mediaByPassageId.getOrDefault(p.getPassageId(), List.of()),
                                false)));
    }

    private CurrentSessionResponse buildMockStageResponse(LearningPlan plan) {
        long cleared = countClearedTasks(plan.getLearningPlanId());
        long total = taskRepository.countByLearningPlanId(plan.getLearningPlanId());

        return learningMapper.toMockStageResponse(
                plan,
                PlanStage.MOCK.name(),
                (int) total,
                (int) cleared);
    }

    private CurrentSessionResponse buildPickResponse(LearningPlan plan, PlanStage stage) {
        List<LearningPlanTask> taskEntities = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(
                plan.getLearningPlanId());
        PlanTaskViewAssembler.Lookups lookups = taskViewAssembler.lookupsFor(taskEntities);
        long cleared = countClearedTasks(plan.getLearningPlanId());

        return learningMapper.toPickResponse(
                plan,
                (stage != null ? stage : PlanStage.FOUNDATION).name(),
                taskViewAssembler.buildPartGroups(taskEntities, lookups),
                taskEntities.size(),
                (int) cleared);
    }

    private long countClearedTasks(String learningPlanId) {
        return taskRepository.countByLearningPlanIdAndStatus(learningPlanId, TaskStatus.PASSED)
                + taskRepository.countByLearningPlanIdAndStatus(learningPlanId, TaskStatus.SKIPPED);
    }

    private RecommendedResourceResponse toResourceDto(RecoveryResource r) {
        return learningMapper.toResourceDto(r);
    }
}
