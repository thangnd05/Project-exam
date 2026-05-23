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

    private static final int SESSION_QUESTION_COUNT = 10;
    private static final int QUESTION_POOL_FETCH_SIZE = 80;

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

    @Transactional
    public CurrentSessionResponse getCurrentSession(
            String userId, String learningPlanId, String taskId) {
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
        if (task.getStatus() == TaskStatus.SKIPPED) {
            throw new BadRequestException("Ải này đã bỏ qua, không thể học.");
        }

        abandonOtherInProgressSessions(learningPlanId, taskId);

        if (task.getStatus() == TaskStatus.LOCKED) {
            task.setStatus(TaskStatus.ACTIVE);
            taskRepository.save(task);
        }

        Optional<LearningPlanSession> inProgress = sessionRepository
                .findFirstByLearningPlanIdAndTaskIdAndStatusOrderByStartedAtDesc(
                        learningPlanId, taskId, SessionStatus.IN_PROGRESS);
        if (inProgress.isPresent()) {
            return buildSessionResponse(plan, inProgress.get());
        }

        LearningPlanSession session = createTagSession(plan, task);
        return buildSessionResponse(plan, session);
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

        int correct = 0;
        List<LearningPlanSessionAnswer> rows = new ArrayList<>();
        for (SubmitSessionRequest.AnswerItem item : request.getAnswers()) {
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
                taskRepository.save(task);
            } else {
                task.setStatus(TaskStatus.ACTIVE);
                taskStatus = TaskStatus.ACTIVE.name();
                taskRepository.save(task);
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
                .build();
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

    private LearningPlanSession createTagSession(LearningPlan plan, LearningPlanTask task) {
        List<String> questionIds = pickQuestionsForTag(
                plan.getUserId(), task.getTagId(), task.getExamPartId(), SESSION_QUESTION_COUNT);

        LearningPlanSession session = new LearningPlanSession();
        session.setLearningPlanId(plan.getLearningPlanId());
        session.setTaskId(task.getTaskId());
        session.setPlanStage(PlanStage.FOUNDATION);
        session.setResourceId(resolveResourceId(task.getTagId()));
        session.setQuestionCount(questionIds.size());
        session.setStatus(SessionStatus.IN_PROGRESS);
        session = sessionRepository.save(session);

        saveSessionQuestions(session.getSessionId(), questionIds);
        questionIds.forEach(qid -> recordExposure(plan.getUserId(), qid));
        return session;
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
        List<Question> pool = questionRepository.findRandomQuestionsByTagAndExamPart(
                tagId, examPartId, PageRequest.of(0, QUESTION_POOL_FETCH_SIZE));
        if (pool.size() < count) {
            pool = new ArrayList<>(pool);
            List<Question> fallback = questionRepository.findRandomQuestionsByExamPartId(
                    examPartId, PageRequest.of(0, QUESTION_POOL_FETCH_SIZE));
            for (Question q : fallback) {
                if (pool.stream().noneMatch(p -> p.getQuestionId().equals(q.getQuestionId()))) {
                    pool.add(q);
                }
            }
        }
        return selectUnseen(userId, pool, count);
    }

    private List<String> selectUnseen(String userId, List<Question> pool, int count) {
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
                        resourceLookup.findFirstByTagIds(List.of(task.getTagId()));
                activeTaskDto = toTaskDto(task, resourcesByTag);
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
        Map<String, PlanPhaseDto.RecommendedResourceDto> resourcesByTag =
                resourceLookup.findFirstByTagIds(
                        taskEntities.stream().map(LearningPlanTask::getTagId).toList());
        List<PlanTaskDto> taskDtos = taskEntities.stream()
                .map(t -> toTaskDto(t, resourcesByTag))
                .toList();
        long passed = taskRepository.countByLearningPlanIdAndStatus(
                plan.getLearningPlanId(), TaskStatus.PASSED);

        return CurrentSessionResponse.builder()
                .mode("PICK")
                .learningPlanId(plan.getLearningPlanId())
                .planStage(plan.getPlanStage().name())
                .partGroups(buildPartGroups(taskEntities, resourcesByTag))
                .tasks(taskDtos)
                .totalTasks(taskEntities.size())
                .passedTasks((int) passed)
                .questions(List.of())
                .message("Đọc tài liệu trong từng ải trước, sau đó bấm Học ải để luyện.")
                .build();
    }

    private List<PlanPartGroupDto> buildPartGroups(
            List<LearningPlanTask> tasks,
            Map<String, PlanPhaseDto.RecommendedResourceDto> resourcesByTag) {
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
            List<LearningPlanTask> partTasks = entry.getValue();
            ExamPart part = examPartRepository.findById(partId).orElse(null);
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
                    .tasks(partTasks.stream().map(t -> toTaskDto(t, resourcesByTag)).toList())
                    .build());
        }
        return groups;
    }

    private String formatSessionMessage(PlanTaskDto active) {
        if (active != null && active.getExamPartName() != null) {
            return String.format(
                    "Đang ôn %s — tag %s (%d câu, chỉ Part này, không trộn).",
                    active.getExamPartName(),
                    active.getTagName(),
                    SESSION_QUESTION_COUNT);
        }
        return "Đọc tài liệu, sau đó làm quiz của đúng Part/tag hiện tại.";
    }

    private PlanTaskDto toTaskDto(
            LearningPlanTask task,
            Map<String, PlanPhaseDto.RecommendedResourceDto> resourcesByTag) {
        Tag tag = tagRepository.findById(task.getTagId()).orElse(null);
        ExamPart part = examPartRepository.findById(task.getExamPartId()).orElse(null);
        PlanPhaseDto.RecommendedResourceDto studyResource = resourcesByTag != null
                ? resourcesByTag.get(task.getTagId())
                : null;
        int priorityScore = task.getPriorityScore() != null ? task.getPriorityScore() : 0;
        String tier = PlanPrioritySupport.tierFromScore(priorityScore);
        return PlanTaskDto.builder()
                .taskId(task.getTaskId())
                .taskOrder(task.getTaskOrder())
                .tagId(task.getTagId())
                .tagName(tag != null ? tag.getName() : task.getTagId())
                .examPartId(task.getExamPartId())
                .examPartName(part != null ? part.getName() : null)
                .status(task.getStatus().name())
                .passAccuracy(task.getPassAccuracy())
                .baselineAccuracy(task.getBaselineAccuracy())
                .bestAccuracy(task.getBestAccuracy())
                .attemptCount(task.getAttemptCount())
                .studyResource(studyResource)
                .priorityScore(priorityScore)
                .priorityTier(tier)
                .wrongCountAtDiagnosis(task.getWrongCountAtDiagnosis())
                .recommendedFirst(PlanPrioritySupport.TIER_HIGH.equals(tier))
                .build();
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
