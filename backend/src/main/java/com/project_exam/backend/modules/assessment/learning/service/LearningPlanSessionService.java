package com.project_exam.backend.modules.assessment.learning.service;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.util.AnswerGradingUtil;
import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.repository.AnswerRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.RecoveryResourceRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ResourceTagRepository;
import com.project_exam.backend.modules.assessment.exam.service.AnswerService;
import com.project_exam.backend.modules.assessment.learning.domain.*;
import com.project_exam.backend.modules.assessment.learning.dto.*;
import com.project_exam.backend.modules.assessment.learning.mapper.LearningMapper;
import com.project_exam.backend.modules.assessment.learning.repository.*;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanQuestionTargets;
import com.project_exam.backend.modules.assessment.learning.support.LearningPlanTaskUnlockSupport;
import com.project_exam.backend.modules.assessment.learning.support.PlanPrioritySupport;
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
import org.springframework.data.domain.PageRequest;
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
    private final ExamPartRepository examPartRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final RecoveryResourceRepository recoveryResourceRepository;
    private final LearningPlanResourceLookup resourceLookup;
    private final PlanTaskViewAssembler taskViewAssembler;
    private final LearningPlanTaskUnlockSupport taskUnlockSupport;
    private final StreakService streakService;
    private final LearningMapper learningMapper;

    /**
     * Trạng thái hiện tại của kế hoạch — CHỈ ĐỌC, không tạo phiên/không đổi trạng thái ải.
     * Muốn bắt đầu (hoặc quay lại) một ải thì gọi {@link #startTaskSession} (POST).
     */
    @Transactional(readOnly = true)
    public CurrentSessionResponse getCurrentSession(
            String userId, String learningPlanId, String taskId, boolean includeReview) {
        LearningPlan plan = requireOwnedPlan(userId, learningPlanId);
        PlanStage stage = effectiveStage(plan);

        if (taskId == null || taskId.isBlank()) {
            return stage == PlanStage.MOCK
                    ? buildMockStageResponse(plan)
                    : buildPickResponse(plan, stage);
        }

        LearningPlanTask task = requireTaskOfPlan(learningPlanId, taskId);

        // Xem lại một ải cụ thể vẫn phải chạy được cả khi plan đã sang trạm MOCK
        // (vượt ải cuối xong mới xem kết quả).
        if (includeReview) {
            return buildReviewResponse(plan, task);
        }

        // Đã có phiên đang làm dở thì trả về để làm tiếp; còn lại về màn chọn ải.
        return sessionRepository
                .findFirstByLearningPlanIdAndTaskIdAndStatusOrderByStartedAtDesc(
                        learningPlanId, taskId, SessionStatus.IN_PROGRESS)
                .map(session -> buildSessionResponse(plan, stage, session))
                .orElseGet(() -> stage == PlanStage.MOCK
                        ? buildMockStageResponse(plan)
                        : buildPickResponse(plan, stage));
    }

    /**
     * Bắt đầu/quay lại phiên luyện của một ải — đây là đường DUY NHẤT được ghi DB
     * (tạo phiên, bỏ dở phiên ải khác, bỏ qua ải kho rỗng).
     */
    @Transactional
    public CurrentSessionResponse startTaskSession(String userId, String learningPlanId, String taskId) {
        LearningPlan plan = requireOwnedPlan(userId, learningPlanId);
        PlanStage stage = normalizePlanStage(plan);

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

        // Kho câu của ải rỗng (pool=0) -> không thể pass, sẽ kẹt. Tự SKIP để không chặn tiến độ.
        List<String> questionIds = pickQuestionsForTask(plan, task);
        if (questionIds.isEmpty()) {
            boolean skipped = skipEmptyPoolTask(plan, task);
            if (plan.getPlanStage() == PlanStage.MOCK) {
                return buildMockStageResponse(plan);
            }
            // Nói rõ lý do bị đá về màn chọn ải, không im lặng như trước.
            CurrentSessionResponse response = buildPickResponse(plan, plan.getPlanStage());
            response.setNotice(skipped
                    ? "Ải này chưa có câu hỏi nào trong kho nên đã được bỏ qua — hãy chọn ải khác."
                    : "Ải này hiện chưa có câu hỏi để luyện lại. Hãy chọn ải khác.");
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

    /**
     * Ải có kho câu rỗng -> đánh dấu SKIPPED rồi kiểm tra điều kiện lên MOCK.
     *
     * @return true nếu vừa đánh dấu bỏ qua (false = ải đã vượt, không hạ trạng thái).
     */
    private boolean skipEmptyPoolTask(LearningPlan plan, LearningPlanTask task) {
        // Ải đã vượt (bấm luyện lại) không bị hạ về SKIPPED chỉ vì kho câu tạm rỗng.
        if (task.getStatus() == TaskStatus.PASSED) {
            return false;
        }
        task.setStatus(TaskStatus.SKIPPED);
        taskRepository.save(task);
        maybeAdvanceToMock(plan);
        return true;
    }

    /** Lên MOCK khi mọi ải đã PASSED hoặc SKIPPED (không còn ải nào phải làm). */
    private void maybeAdvanceToMock(LearningPlan plan) {
        String planId = plan.getLearningPlanId();
        long total = taskRepository.countByLearningPlanId(planId);
        long passed = taskRepository.countByLearningPlanIdAndStatus(planId, TaskStatus.PASSED);
        long skipped = taskRepository.countByLearningPlanIdAndStatus(planId, TaskStatus.SKIPPED);
        if (total > 0 && passed + skipped == total) {
            advanceToMockStage(plan);
        }
    }

    private CurrentSessionResponse buildReviewResponse(LearningPlan plan, LearningPlanTask task) {
        List<LearningPlanSession> sessions = sessionRepository
                .findByLearningPlanIdAndTaskIdOrderByStartedAtDesc(
                        plan.getLearningPlanId(), task.getTaskId());
        // Phiên bỏ dở (đổi ải giữa chừng) cũng mang status SUBMITTED nhưng 0% và không có bài làm
        // -> phải loại, nếu không "Xem giải thích" sẽ hiện bài trống thay vì lần luyện thật.
        LearningPlanSession lastSubmitted = sessions.stream()
                .filter(s -> s.getStatus() == SessionStatus.SUBMITTED)
                .filter(s -> !Boolean.TRUE.equals(s.getAbandoned()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Chưa có phiên học nào được nộp cho ải này."));

        return buildReviewResponse(plan, lastSubmitted);
    }

    /** Dựng lại bài làm của đúng một phiên đã nộp (câu hỏi + lựa chọn của user + đáp án đúng). */
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
                accuracy + "% (" + correct + "/" + total + " đúng)",
                reviewItems);
    }

    /** Xem lại bài làm của một phiên bất kỳ trong lịch sử (không chỉ phiên gần nhất). */
    @Transactional(readOnly = true)
    public CurrentSessionResponse getSessionReview(
            String userId, String learningPlanId, String sessionId) {
        LearningPlan plan = requireOwnedPlan(userId, learningPlanId);

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

    /** Trạm hiệu lực của plan, KHÔNG ghi DB — plan cũ ở trạm MIX quy về FOUNDATION/MOCK. */
    private PlanStage effectiveStage(LearningPlan plan) {
        PlanStage stage = plan.getPlanStage();
        if (stage == null) {
            return PlanStage.FOUNDATION;
        }
        if (stage != PlanStage.MIX) {
            return stage;
        }
        long total = taskRepository.countByLearningPlanId(plan.getLearningPlanId());
        long passed = taskRepository.countByLearningPlanIdAndStatus(
                plan.getLearningPlanId(), TaskStatus.PASSED);
        return total > 0 && passed == total ? PlanStage.MOCK : PlanStage.FOUNDATION;
    }

    /** Như {@link #effectiveStage} nhưng lưu lại — chỉ gọi ở luồng vốn đã ghi DB. */
    private PlanStage normalizePlanStage(LearningPlan plan) {
        PlanStage stage = effectiveStage(plan);
        if (plan.getPlanStage() != stage) {
            plan.setPlanStage(stage);
            planRepository.save(plan);
        }
        return stage;
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

        Map<String, List<Answer>> correctByQuestion = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(allowedQuestionIds))
                .stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        // Cần loại câu hỏi (MCQ/MSQ/FILL) để chấm đúng.
        Map<String, Question> questionMap = questionRepository.findAllById(allowedQuestionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q, (a, b) -> a));

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
            // Không ghi exposure ở đây: đã ghi đủ cho cả phiên lúc tạo session.
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

        // Pass 1 ải learning plan -> ghi nhận streak (side-effect, không phá luồng nộp bài)
        if (passed) {
            AfterCommitTasks.runQuietly(
                    () -> streakService.recordActivity(userId, StreakActivityType.LESSON_PASS));
        }

        String taskStatus = null;
        PlanStage stage = plan.getPlanStage() != null ? plan.getPlanStage() : PlanStage.FOUNDATION;
        // Ghi nhận theo ải của chính phiên này, kể cả khi plan đã sang trạm MOCK (luyện lại ải cũ).
        if (session.getTaskId() != null) {
            LearningPlanTask task = taskRepository.findById(session.getTaskId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy nhiệm vụ"));
            task.setAttemptCount(task.getAttemptCount() + 1);
            if (task.getBestAccuracy() == null
                    || accuracy > task.getBestAccuracy().intValue()) {
                task.setBestAccuracy(java.math.BigDecimal.valueOf(accuracy));
            }
            // Luyện lại ải đã vượt mà không đạt thì vẫn giữ PASSED — không tụt tiến độ đã đạt.
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
            // Ải đang ở trạng thái đã vượt thì không tính chuỗi trượt (tránh gắn nhãn "Đang bí"
            // cho ải đã PASSED chỉ vì luyện lại chưa đạt).
            int consecutiveFails = taskPassed
                    ? 0
                    : countConsecutiveFails(learningPlanId, task.getTaskId());
            task.setConsecutiveFails(consecutiveFails);
            task.setPriorityScore(PlanPrioritySupport.recomputePriorityAfterSession(
                    task.getWrongCountAtDiagnosis(),
                    task.getBestAccuracy().intValue(),
                    task.getPassAccuracy(),
                    consecutiveFails,
                    taskPassed));
            taskRepository.save(task);
            if (passed) {
                taskUnlockSupport.onTaskPassed(task, learningPlanId);
            }
            maybeAdvanceToMock(plan);
        }

        String message = passed
                ? "Chúc mừng! Bạn đã vượt ải này."
                : "Chưa đạt ngưỡng " + passRequired + "%. Hãy đọc lại tài liệu và thử lại.";

        List<SubmitSessionResponse.ReviewItem> reviewItems =
                buildReviewItems(sessionQuestions, rows, correctByQuestion);

        return learningMapper.toSubmitSessionResponse(
                sessionId,
                correct,
                total,
                accuracy,
                passed,
                taskStatus,
                (plan.getPlanStage() != null ? plan.getPlanStage() : stage).name(),
                message,
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

            // MSQ: gom lựa chọn của user; MCQ: fallback về selectedAnswerId đơn.
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

    /** Lịch sử các phiên luyện của một ải. Mới nhất trước. */
    @Transactional(readOnly = true)
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

        // Bỏ phiên bỏ dở: không phải một lần luyện thật, hiện lên sẽ lệch với "Số lần luyện"
        // và nút "Xem đáp án" mở ra bài trống.
        return sessions.stream()
                .filter(s -> !Boolean.TRUE.equals(s.getAbandoned()))
                .map(learningMapper::toTaskSessionHistory)
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

    /** Chọn câu cho ải (không side-effect) — tách để check kho rỗng trước khi tạo session. */
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
        session.setPlanStage(PlanStage.FOUNDATION);
        session.setResourceId(taskType == PlanTaskType.TAG ? resolveResourceId(task.getTagId()) : null);
        session.setQuestionCount(questionIds.size());
        session.setStatus(SessionStatus.IN_PROGRESS);
        session = sessionRepository.save(session);

        saveSessionQuestions(session.getSessionId(), questionIds);
        recordExposures(plan.getUserId(), questionIds);
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

    /**
     * Lấy tối đa {@code count} câu: ưu tiên câu chưa gặp bao giờ, thiếu thì bù bằng câu
     * ĐÃ GẶP ÍT NHẤT (trước đây bù bằng đầu pool nên câu vừa làm dễ lặp lại ngay).
     */
    private List<String> selectFromPool(String userId, List<Question> pool, int count) {
        List<String> ids = pool.stream().map(Question::getQuestionId).distinct().toList();
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

    /**
     * Đếm fail streak gần nhất cho task này.
     * - Chỉ xét tối đa 5 session gần nhất (đủ vì threshold struggle là 3).
     * - Bỏ qua session abandoned (user switch task giữa chừng), KHÔNG nhầm với fail thật 0%.
     * - Gặp pass hoặc session bất thường dừng đếm (fail-safe, không gộp streak cũ).
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

    /**
     * Ghi nhận user đã nhìn thấy các câu này (dùng để ưu tiên câu chưa gặp ở phiên sau).
     * Ghi 1 lần lúc tạo phiên, theo lô — trước đây gọi từng câu ở cả lúc tạo lẫn lúc nộp
     * nên timesSeen bị đếm gấp đôi và tốn ~2 query/câu.
     */
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

        List<QuestionResponse> questionDtos = new ArrayList<>();
        for (String qid : questionIds) {
            Question q = questionMap.get(qid);
            if (q == null) continue;
            questionDtos.add(learningMapper.toQuestionResponse(
                    q, answersMap.getOrDefault(qid, List.of())));
        }

        PlanTaskDto activeTaskDto = null;
        if (session.getTaskId() != null) {
            Optional<LearningPlanTask> taskOpt = taskRepository.findById(session.getTaskId());
            if (taskOpt.isPresent()) {
                LearningPlanTask task = taskOpt.get();
                List<LearningPlanTask> singleTaskList = List.of(task);
                activeTaskDto = taskViewAssembler.toTaskDto(
                        task, taskViewAssembler.lookupsFor(singleTaskList));
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
                (int) passed,
                formatSessionMessage(activeTaskDto));
    }

    private CurrentSessionResponse buildMockStageResponse(LearningPlan plan) {
        long passed = taskRepository.countByLearningPlanIdAndStatus(
                plan.getLearningPlanId(), TaskStatus.PASSED);
        long total = taskRepository.countByLearningPlanId(plan.getLearningPlanId());

        return learningMapper.toMockStageResponse(
                plan,
                PlanStage.MOCK.name(),
                (int) total,
                (int) passed,
                "Đã hoàn thành ải theo từng Part. Làm Full Mock để kiểm tra readiness.");
    }

    private CurrentSessionResponse buildPickResponse(LearningPlan plan, PlanStage stage) {
        List<LearningPlanTask> taskEntities = taskRepository.findByLearningPlanIdOrderByTaskOrderAsc(
                plan.getLearningPlanId());
        PlanTaskViewAssembler.Lookups lookups = taskViewAssembler.lookupsFor(taskEntities);
        long passed = taskRepository.countByLearningPlanIdAndStatus(
                plan.getLearningPlanId(), TaskStatus.PASSED);

        return learningMapper.toPickResponse(
                plan,
                (stage != null ? stage : PlanStage.FOUNDATION).name(),
                taskViewAssembler.buildPartGroups(taskEntities, lookups),
                taskViewAssembler.toTaskDtos(taskEntities, lookups),
                taskEntities.size(),
                (int) passed,
                "Đọc tài liệu trong từng ải trước, sau đó bấm Học ải để luyện.");
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

    private PlanPhaseDto.RecommendedResourceDto toResourceDto(RecoveryResource r) {
        return learningMapper.toResourceDto(r);
    }
}
