package com.project_exam.backend.modules.assessment.learning.service;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.repository.AnswerRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.RecoveryResourceRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ResourceTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.modules.assessment.exam.service.AnswerService;
import com.project_exam.backend.modules.assessment.learning.domain.*;
import com.project_exam.backend.modules.assessment.learning.dto.*;
import com.project_exam.backend.modules.assessment.learning.repository.*;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanQuestionTargets;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanTaskUnlockSupport;
import com.project_exam.backend.modules.assessment.learning.support.PlanPrioritySupport;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
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
    private final ExamPartRepository examPartRepository;
    private final TagRepository tagRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final RecoveryResourceRepository recoveryResourceRepository;
    private final LearningPlanResourceLookup resourceLookup;
    private final LearningPlanTaskUnlockSupport taskUnlockSupport;

    @Transactional
    public CurrentSessionResponse getCurrentSession(
            String userId, String learningPlanId, String taskId, boolean includeReview) {
        LearningPlan plan = requireOwnedPlan(userId, learningPlanId);

        normalizePlanStage(plan);

        if (plan.getPlanStage() == PlanStage.MOCK) {
            return buildMockStageResponse(plan);
        }

        if (taskId == null || taskId.isBlank()) {
            return buildPickResponse(plan);
        }

        LearningPlanTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhiệm vụ"));
        if (!Objects.equals(task.getLearningPlanId(), learningPlanId)) {
            throw new ForbiddenException("Nhiệm vụ không thuộc kế hoạch này");
        }

        if (includeReview) {
            return buildReviewResponse(plan, task);
        }

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
            return buildSessionResponse(plan, inProgress.get());
        }

        LearningPlanSession session = createQuizSession(plan, task);
        return buildSessionResponse(plan, session);
    }

    private CurrentSessionResponse buildReviewResponse(LearningPlan plan, LearningPlanTask task) {
        List<LearningPlanSession> sessions = sessionRepository
                .findByLearningPlanIdAndTaskIdOrderByStartedAtDesc(
                        plan.getLearningPlanId(), task.getTaskId());
        LearningPlanSession lastSubmitted = sessions.stream()
                .filter(s -> s.getStatus() == SessionStatus.SUBMITTED)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Chưa có phiên học nào được nộp cho ải này."));

        List<LearningPlanSessionQuestion> sessionQuestions =
                sessionQuestionRepository.findBySessionIdOrderByDisplayOrderAsc(lastSubmitted.getSessionId());
        List<String> questionIds = sessionQuestions.stream()
                .map(LearningPlanSessionQuestion::getQuestionId)
                .toList();
        Map<String, Answer> correctByQuestion = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.toMap(Answer::getQuestionId, a -> a, (a, b) -> a));
        List<LearningPlanSessionAnswer> userAnswerRows =
                sessionAnswerRepository.findBySessionId(lastSubmitted.getSessionId());

        List<SubmitSessionResponse.ReviewItem> reviewItems =
                buildReviewItems(sessionQuestions, userAnswerRows, correctByQuestion);

        int total = sessionQuestions.size();
        int accuracy = lastSubmitted.getAccuracy() != null ? lastSubmitted.getAccuracy() : 0;

        return CurrentSessionResponse.builder()
                .mode("REVIEW")
                .learningPlanId(plan.getLearningPlanId())
                .planStage(plan.getPlanStage() != null ? plan.getPlanStage().name() : null)
                .sessionId(lastSubmitted.getSessionId())
                .totalTasks(null)
                .passedTasks(null)
                .message(accuracy + "% (" + (int) Math.round(accuracy / 100.0 * total) + "/" + total + " đúng)")
                .lastReviewItems(reviewItems)
                .build();
    }

    private String lockedTaskMessage(LearningPlanTask task) {
        PlanTaskType type = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;
        if (type == PlanTaskType.PART_CAPSTONE_2) {
            return "Hoàn thành ải tổng ôn lần 1 trước khi mở lần 2.";
        }
        return "Hoàn thành tất cả ải tag của Part này trước khi mở ải tổng ôn.";
    }

    /** Plan cũ ở trạm MIX → chuyển về FOUNDATION hoặc MOCK. */
    private void normalizePlanStage(LearningPlan plan) {
        if (plan.getPlanStage() == PlanStage.MIX) {
            long total = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(
                    plan.getLearningPlanId()).size();
            long passed = taskRepository.countByLearningPlanIdAndStatus(
                    plan.getLearningPlanId(), TaskStatus.PASSED);
            if (total > 0 && passed == total) {
                plan.setPlanStage(PlanStage.MOCK);
            } else {
                plan.setPlanStage(PlanStage.FOUNDATION);
            }
            planRepository.save(plan);
        }
        if (plan.getPlanStage() == null) {
            plan.setPlanStage(PlanStage.FOUNDATION);
            planRepository.save(plan);
        }
    }

    @Transactional
    public SubmitSessionResponse submitSession(
            String userId,
            String learningPlanId,
            String sessionId,
            SubmitSessionRequest request) {
        LearningPlan plan = requireOwnedPlan(userId, learningPlanId);
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

        Map<String, Answer> correctByQuestion = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(allowedQuestionIds))
                .stream()
                .collect(Collectors.toMap(Answer::getQuestionId, a -> a, (a, b) -> a));

        // Dedup theo questionId — giữ entry đầu tiên, bỏ duplicate (FE bug / replay attack).
        // Tránh đội accuracy lên sai khi cùng 1 câu xuất hiện nhiều lần.
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
            Answer correctAnswer = correctByQuestion.get(item.getQuestionId());
            boolean isCorrect = correctAnswer != null
                    && Objects.equals(correctAnswer.getAnswerId(), item.getSelectedAnswerId());
            if (isCorrect) correct++;

            LearningPlanSessionAnswer row = new LearningPlanSessionAnswer();
            row.setSessionId(sessionId);
            row.setQuestionId(item.getQuestionId());
            row.setSelectedAnswerId(item.getSelectedAnswerId());
            row.setIsCorrect(isCorrect);
            rows.add(row);
            recordExposure(userId, item.getQuestionId());
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

        String taskStatus = null;
        PlanStage stage = plan.getPlanStage() != null ? plan.getPlanStage() : PlanStage.FOUNDATION;
        if (stage == PlanStage.FOUNDATION && session.getTaskId() != null) {
            LearningPlanTask task = taskRepository.findById(session.getTaskId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy nhiệm vụ"));
            task.setAttemptCount(task.getAttemptCount() + 1);
            if (task.getBestAccuracy() == null
                    || accuracy > task.getBestAccuracy().intValue()) {
                task.setBestAccuracy(java.math.BigDecimal.valueOf(accuracy));
            }
            if (passed) {
                task.setStatus(TaskStatus.PASSED);
                task.setPassedAt(Instant.now());
                taskStatus = TaskStatus.PASSED.name();
            } else {
                task.setStatus(TaskStatus.ACTIVE);
                taskStatus = TaskStatus.ACTIVE.name();
            }
            int consecutiveFails = countConsecutiveFails(learningPlanId, task.getTaskId());
            task.setConsecutiveFails(consecutiveFails);
            task.setPriorityScore(PlanPrioritySupport.recomputePriorityAfterSession(
                    task.getWrongCountAtDiagnosis(),
                    task.getBestAccuracy().intValue(),
                    task.getPassAccuracy(),
                    consecutiveFails,
                    passed));
            taskRepository.save(task);
            if (passed) {
                taskUnlockSupport.onTaskPassed(task, learningPlanId);
            }
            long totalTasks = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(learningPlanId).size();
            long passedCount = taskRepository.countByLearningPlanIdAndStatus(
                    learningPlanId, TaskStatus.PASSED);
            if (totalTasks > 0 && passedCount == totalTasks) {
                advanceToMockStage(plan);
            }
        }

        String message = passed
                ? "Chúc mừng! Bạn đã vượt ải này."
                : "Chưa đạt ngưỡng " + passRequired + "%. Hãy đọc lại tài liệu và thử lại.";

        List<SubmitSessionResponse.ReviewItem> reviewItems =
                buildReviewItems(sessionQuestions, rows, correctByQuestion);

        return SubmitSessionResponse.builder()
                .sessionId(sessionId)
                .correctCount(correct)
                .totalCount(total)
                .accuracy(accuracy)
                .passed(passed)
                .taskStatus(taskStatus)
                .planStage(plan.getPlanStage().name())
                .unlockedNextTask(false)
                .message(message)
                .reviewItems(reviewItems)
                .build();
    }

    private List<SubmitSessionResponse.ReviewItem> buildReviewItems(
            List<LearningPlanSessionQuestion> sessionQuestions,
            List<LearningPlanSessionAnswer> userAnswerRows,
            Map<String, Answer> correctByQuestion) {

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
            Answer correct = correctByQuestion.get(qid);
            List<Answer> answerList = allAnswers.getOrDefault(qid, List.of());

            List<SubmitSessionResponse.ReviewAnswer> reviewAnswers = answerList.stream()
                    .map(a -> SubmitSessionResponse.ReviewAnswer.builder()
                            .answerId(a.getAnswerId())
                            .answerText(a.getAnswerText())
                            .answerLabel(a.getAnswerLabel())
                            .isCorrect(Boolean.TRUE.equals(a.getIsCorrect()))
                            .build())
                    .toList();

            items.add(SubmitSessionResponse.ReviewItem.builder()
                    .questionId(qid)
                    .questionText(q.getQuestionText())
                    .answers(reviewAnswers)
                    .selectedAnswerId(userAns != null ? userAns.getSelectedAnswerId() : null)
                    .correctAnswerId(correct != null ? correct.getAnswerId() : null)
                    .isCorrect(userAns != null && Boolean.TRUE.equals(userAns.getIsCorrect()))
                    .explanation(q.getExplanation())
                    .build());
        }
        return items;
    }

    /** Lịch sử các phiên luyện của một ải. Mới nhất trước. */
    public List<TaskSessionHistoryDto> getTaskSessionHistory(
            String userId, String learningPlanId, String taskId) {
        requireOwnedPlan(userId, learningPlanId);

        LearningPlanTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhiệm vụ"));
        if (!Objects.equals(task.getLearningPlanId(), learningPlanId)) {
            throw new ForbiddenException("Nhiệm vụ không thuộc kế hoạch này");
        }

        List<LearningPlanSession> sessions = sessionRepository
                .findByLearningPlanIdAndTaskIdOrderByStartedAtDesc(learningPlanId, taskId);

        return sessions.stream()
                .map(s -> TaskSessionHistoryDto.builder()
                        .sessionId(s.getSessionId())
                        .planStage(s.getPlanStage() != null ? s.getPlanStage().name() : null)
                        .status(s.getStatus() != null ? s.getStatus().name() : null)
                        .questionCount(s.getQuestionCount())
                        .accuracy(s.getAccuracy())
                        .passed(s.getPassed())
                        .startedAt(s.getStartedAt())
                        .submittedAt(s.getSubmittedAt())
                        .build())
                .toList();
    }

    private LearningPlan requireOwnedPlan(String userId, String learningPlanId) {
        LearningPlan plan = planRepository.findById(learningPlanId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch học"));
        if (!Objects.equals(plan.getUserId(), userId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập kế hoạch này");
        }
        return plan;
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

    private void advanceToMockStage(LearningPlan plan) {
        plan.setPlanStage(PlanStage.MOCK);
        plan.setCurrentTaskId(null);
        planRepository.save(plan);
    }

    private int resolvePassAccuracy(LearningPlan plan, LearningPlanSession session) {
        if (session.getTaskId() == null) {
            return plan.getPassAccuracyDefault() != null ? plan.getPassAccuracyDefault() : 70;
        }
        return taskRepository.findById(session.getTaskId())
                .map(LearningPlanTask::getPassAccuracy)
                .orElse(plan.getPassAccuracyDefault() != null ? plan.getPassAccuracyDefault() : 70);
    }

    private LearningPlanSession createQuizSession(LearningPlan plan, LearningPlanTask task) {
        int targetCount = resolveTargetQuestionCount(task);
        PlanTaskType taskType = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;
        List<String> questionIds;
        if (taskType == PlanTaskType.TAG) {
            questionIds = pickQuestionsForTag(
                    plan.getUserId(), task.getTagId(), task.getExamPartId(), targetCount);
        } else {
            questionIds = pickQuestionsForPart(plan.getUserId(), task.getExamPartId(), targetCount);
        }

        LearningPlanSession session = new LearningPlanSession();
        session.setLearningPlanId(plan.getLearningPlanId());
        session.setTaskId(task.getTaskId());
        session.setPlanStage(PlanStage.FOUNDATION);
        session.setResourceId(taskType == PlanTaskType.TAG ? resolveResourceId(task.getTagId()) : null);
        session.setQuestionCount(questionIds.size());
        session.setStatus(SessionStatus.IN_PROGRESS);
        session = sessionRepository.save(session);

        saveSessionQuestions(session.getSessionId(), questionIds);
        questionIds.forEach(qid -> recordExposure(plan.getUserId(), qid));
        return session;
    }

    private int resolveTargetQuestionCount(LearningPlanTask task) {
        if (task.getTargetQuestionCount() != null && task.getTargetQuestionCount() > 0) {
            return task.getTargetQuestionCount();
        }
        PlanTaskType type = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;
        if (type == PlanTaskType.TAG) {
            return LearningPlanQuestionTargets.TAG_TARGET;
        }
        ExamPart part = examPartRepository.findById(task.getExamPartId()).orElse(null);
        return LearningPlanQuestionTargets.resolveCapstoneTarget(part);
    }

    private void saveSessionQuestions(String sessionId, List<String> questionIds) {
        int order = 1;
        for (String qid : questionIds) {
            LearningPlanSessionQuestion sq = new LearningPlanSessionQuestion();
            sq.setSessionId(sessionId);
            sq.setQuestionId(qid);
            sq.setDisplayOrder(order++);
            sessionQuestionRepository.save(sq);
        }
    }

    private String resolveResourceId(String tagId) {
        return resourceLookup.findFirstByTagId(tagId)
                .map(PlanPhaseDto.RecommendedResourceDto::getResourceId)
                .orElse(null);
    }

    private List<String> pickQuestionsForTag(
            String userId, String tagId, String examPartId, int count) {
        int poolSize = LearningPlanQuestionTargets.poolFetchSize(count);
        List<Question> pool = questionRepository.findRandomQuestionsByTagAndExamPart(
                tagId, examPartId, PageRequest.of(0, poolSize));
        return selectFromPool(userId, pool, count);
    }

    private List<String> pickQuestionsForPart(String userId, String examPartId, int count) {
        int poolSize = LearningPlanQuestionTargets.poolFetchSize(count);
        List<Question> pool = questionRepository.findRandomQuestionsByExamPartId(
                examPartId, PageRequest.of(0, poolSize));
        return selectFromPool(userId, pool, count);
    }

    /** Lấy tối đa {@code count} câu; nếu kho ít hơn thì lấy hết pool. */
    private List<String> selectFromPool(String userId, List<Question> pool, int count) {
        List<String> ids = pool.stream().map(Question::getQuestionId).distinct().toList();
        Set<String> seen = new HashSet<>(exposureRepository.findSeenQuestionIds(userId, ids));
        List<String> result = pool.stream()
                .map(Question::getQuestionId)
                .filter(id -> !seen.contains(id))
                .distinct()
                .limit(count)
                .toList();
        if (result.size() >= count) {
            return result;
        }
        return pool.stream()
                .map(Question::getQuestionId)
                .distinct()
                .limit(count)
                .toList();
    }

    /**
     * Đếm fail streak gần nhất cho task này.
     * - Chỉ xét tối đa 5 session gần nhất (đủ vì threshold struggle là 3).
     * - Bỏ qua session abandoned (user switch task giữa chừng), KHÔNG nhầm với fail thật 0%.
     * - Gặp pass hoặc session bất thường → dừng đếm (fail-safe, không gộp streak cũ).
     * Phải gọi SAU khi save session hiện tại để bao gồm cả lần submit vừa rồi.
     */
    private int countConsecutiveFails(String learningPlanId, String taskId) {
        List<LearningPlanSession> recent = sessionRepository
                .findTop5ByLearningPlanIdAndTaskIdOrderByStartedAtDesc(learningPlanId, taskId);
        int streak = 0;
        for (LearningPlanSession s : recent) {
            if (s.getStatus() != SessionStatus.SUBMITTED) break;
            if (Boolean.TRUE.equals(s.getAbandoned())) continue;
            if (Boolean.FALSE.equals(s.getPassed())) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    private void recordExposure(String userId, String questionId) {
        Optional<UserQuestionExposure> existing = exposureRepository.findByUserIdAndQuestionId(userId, questionId);
        if (existing.isPresent()) {
            UserQuestionExposure e = existing.get();
            e.setTimesSeen(e.getTimesSeen() + 1);
            e.setLastSeenAt(Instant.now());
            exposureRepository.save(e);
        } else {
            UserQuestionExposure e = new UserQuestionExposure();
            e.setUserId(userId);
            e.setQuestionId(questionId);
            exposureRepository.save(e);
        }
    }

    private CurrentSessionResponse buildSessionResponse(LearningPlan plan, LearningPlanSession session) {
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

        List<QuestionResponse> questionDtos = new ArrayList<>();
        for (String qid : questionIds) {
            Question q = questionMap.get(qid);
            if (q == null) continue;
            questionDtos.add(QuestionResponse.builder()
                    .questionId(q.getQuestionId())
                    .questionNumber(q.getQuestionNumber())
                    .examPartId(q.getExamPartId())
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType())
                    .isBank(q.getIsBank())
                    .answers(answersMap.getOrDefault(qid, List.of()))
                    .build());
        }

        PlanTaskDto activeTaskDto = null;
        if (session.getTaskId() != null) {
            Optional<LearningPlanTask> taskOpt = taskRepository.findById(session.getTaskId());
            if (taskOpt.isPresent()) {
                LearningPlanTask task = taskOpt.get();
                Map<String, PlanPhaseDto.RecommendedResourceDto> resourcesByTag =
                        task.getTagId() != null
                                ? resourceLookup.findFirstByTagIds(List.of(task.getTagId()))
                                : Map.of();
                List<LearningPlanTask> singleTaskList = List.of(task);
                activeTaskDto = toTaskDto(task, resourcesByTag,
                        loadTagMap(singleTaskList), loadPartMap(singleTaskList));
            }
        }

        PlanPhaseDto.RecommendedResourceDto resourceDto = null;
        if (session.getResourceId() != null) {
            resourceDto = recoveryResourceRepository.findById(session.getResourceId())
                    .map(this::toResourceDto)
                    .orElse(null);
        }

        long passed = taskRepository.countByLearningPlanIdAndStatus(
                plan.getLearningPlanId(), TaskStatus.PASSED);
        long total = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(plan.getLearningPlanId()).size();

        return CurrentSessionResponse.builder()
                .mode("QUIZ")
                .learningPlanId(plan.getLearningPlanId())
                .planStage(plan.getPlanStage().name())
                .sessionId(session.getSessionId())
                .sessionStatus(session.getStatus().name())
                .activeTask(activeTaskDto)
                .resource(resourceDto)
                .questionCount(session.getQuestionCount())
                .passAccuracyRequired(resolvePassAccuracy(plan, session))
                .questions(questionDtos)
                .totalTasks((int) total)
                .passedTasks((int) passed)
                .message(formatSessionMessage(activeTaskDto))
                .build();
    }

    private CurrentSessionResponse buildMockStageResponse(LearningPlan plan) {
        long passed = taskRepository.countByLearningPlanIdAndStatus(
                plan.getLearningPlanId(), TaskStatus.PASSED);
        long total = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(plan.getLearningPlanId()).size();

        return CurrentSessionResponse.builder()
                .mode("MOCK")
                .learningPlanId(plan.getLearningPlanId())
                .planStage(PlanStage.MOCK.name())
                .sessionStatus(null)
                .questions(List.of())
                .totalTasks((int) total)
                .passedTasks((int) passed)
                .message("Đã hoàn thành ải theo từng Part. Làm Full Mock để kiểm tra readiness.")
                .build();
    }

    private CurrentSessionResponse buildPickResponse(LearningPlan plan) {
        List<LearningPlanTask> taskEntities = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(
                plan.getLearningPlanId());
        List<String> tagIds = taskEntities.stream()
                .map(LearningPlanTask::getTagId)
                .filter(Objects::nonNull)
                .toList();
        Map<String, PlanPhaseDto.RecommendedResourceDto> resourcesByTag =
                resourceLookup.findFirstByTagIds(tagIds);
        Map<String, Tag> tagMap = loadTagMap(taskEntities);
        Map<String, ExamPart> partMap = loadPartMap(taskEntities);
        List<PlanTaskDto> taskDtos = taskEntities.stream()
                .map(t -> toTaskDto(t, resourcesByTag, tagMap, partMap))
                .toList();
        long passed = taskRepository.countByLearningPlanIdAndStatus(
                plan.getLearningPlanId(), TaskStatus.PASSED);

        return CurrentSessionResponse.builder()
                .mode("PICK")
                .learningPlanId(plan.getLearningPlanId())
                .planStage(plan.getPlanStage().name())
                .partGroups(buildPartGroups(taskEntities, resourcesByTag, tagMap, partMap))
                .tasks(taskDtos)
                .totalTasks(taskEntities.size())
                .passedTasks((int) passed)
                .questions(List.of())
                .message("Đọc tài liệu trong từng ải trước, sau đó bấm Học ải để luyện.")
                .build();
    }

    /** Batch-load Tag/ExamPart cho list task, tránh N+1 trong toTaskDto. */
    private Map<String, Tag> loadTagMap(List<LearningPlanTask> tasks) {
        Set<String> tagIds = tasks.stream()
                .map(LearningPlanTask::getTagId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (tagIds.isEmpty()) return Map.of();
        return tagRepository.findAllById(tagIds).stream()
                .collect(Collectors.toMap(Tag::getTagId, t -> t, (a, b) -> a));
    }

    private Map<String, ExamPart> loadPartMap(List<LearningPlanTask> tasks) {
        Set<String> partIds = tasks.stream()
                .map(LearningPlanTask::getExamPartId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (partIds.isEmpty()) return Map.of();
        return examPartRepository.findAllById(partIds).stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, p -> p, (a, b) -> a));
    }

    private List<PlanPartGroupDto> buildPartGroups(
            List<LearningPlanTask> tasks,
            Map<String, PlanPhaseDto.RecommendedResourceDto> resourcesByTag,
            Map<String, Tag> tagMap,
            Map<String, ExamPart> partMap) {
        if (tasks.isEmpty()) {
            return List.of();
        }
        Map<String, List<LearningPlanTask>> byPart = tasks.stream()
                .collect(Collectors.groupingBy(
                        LearningPlanTask::getExamPartId,
                        LinkedHashMap::new,
                        Collectors.toList()));

        List<PlanPartGroupDto> groups = new ArrayList<>();
        for (Map.Entry<String, List<LearningPlanTask>> entry : byPart.entrySet()) {
            String partId = entry.getKey();
            List<LearningPlanTask> partTasks = entry.getValue().stream()
                    .sorted(Comparator.comparingInt(LearningPlanTask::getTaskOrder))
                    .toList();
            ExamPart part = partMap.get(partId);
            int passedInPart = (int) partTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.PASSED)
                    .count();
            Integer passAcc = partTasks.isEmpty() ? null : partTasks.get(0).getPassAccuracy();
            groups.add(PlanPartGroupDto.builder()
                    .examPartId(partId)
                    .examPartName(part != null ? part.getName() : partId)
                    .passAccuracy(passAcc)
                    .passedTasksInPart(passedInPart)
                    .totalTasksInPart(partTasks.size())
                    .tasks(partTasks.stream().map(t -> toTaskDto(t, resourcesByTag, tagMap, partMap)).toList())
                    .build());
        }
        return groups;
    }

    private String formatSessionMessage(PlanTaskDto active) {
        if (active != null && active.getExamPartName() != null) {
            int target = active.getTargetQuestionCount() != null
                    ? active.getTargetQuestionCount()
                    : LearningPlanQuestionTargets.TAG_TARGET;
            return String.format(
                    "Đang ôn %s — %s (mục tiêu %d câu, chỉ Part này).",
                    active.getExamPartName(),
                    active.getTagName(),
                    target);
        }
        return "Đọc tài liệu, sau đó làm quiz của đúng Part/tag hiện tại.";
    }

    private PlanTaskDto toTaskDto(
            LearningPlanTask task,
            Map<String, PlanPhaseDto.RecommendedResourceDto> resourcesByTag,
            Map<String, Tag> tagMap,
            Map<String, ExamPart> partMap) {
        PlanTaskType taskType = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;
        Tag tag = task.getTagId() != null ? tagMap.get(task.getTagId()) : null;
        ExamPart part = task.getExamPartId() != null ? partMap.get(task.getExamPartId()) : null;
        PlanPhaseDto.RecommendedResourceDto studyResource = resourcesByTag != null && task.getTagId() != null
                ? resourcesByTag.get(task.getTagId())
                : null;
        int priorityScore = task.getPriorityScore() != null ? task.getPriorityScore() : 0;
        String tier = PlanPrioritySupport.tierFromScore(priorityScore);
        return PlanTaskDto.builder()
                .taskId(task.getTaskId())
                .taskOrder(task.getTaskOrder())
                .taskType(taskType.name())
                .targetQuestionCount(task.getTargetQuestionCount())
                .tagId(task.getTagId())
                .tagName(resolveTaskDisplayName(taskType, tag, part))
                .examPartId(task.getExamPartId())
                .examPartName(part != null ? part.getName() : null)
                .status(task.getStatus().name())
                .passAccuracy(task.getPassAccuracy())
                .baselineAccuracy(task.getBaselineAccuracy())
                .bestAccuracy(task.getBestAccuracy())
                .attemptCount(task.getAttemptCount())
                .consecutiveFails(task.getConsecutiveFails())
                .studyResource(studyResource)
                .priorityScore(priorityScore)
                .priorityTier(tier)
                .wrongCountAtDiagnosis(task.getWrongCountAtDiagnosis())
                .recommendedFirst(PlanPrioritySupport.TIER_HIGH.equals(tier))
                .build();
    }

    private String resolveTaskDisplayName(PlanTaskType taskType, Tag tag, ExamPart part) {
        if (taskType == PlanTaskType.PART_CAPSTONE_1) {
            return "Tổng ôn Part — lần 1 (200%)";
        }
        if (taskType == PlanTaskType.PART_CAPSTONE_2) {
            return "Tổng ôn Part — lần 2 (200%)";
        }
        if (tag != null) {
            return tag.getName();
        }
        return part != null ? part.getName() : "Ải tag";
    }

    private PlanPhaseDto.RecommendedResourceDto toResourceDto(RecoveryResource r) {
        return PlanPhaseDto.RecommendedResourceDto.builder()
                .resourceId(r.getResourceId())
                .title(r.getTitle())
                .description(r.getDescription())
                .url(r.getUrl())
                .originalFileName(r.getOriginalFileName())
                .build();
    }
}
