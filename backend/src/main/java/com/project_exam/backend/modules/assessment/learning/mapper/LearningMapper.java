package com.project_exam.backend.modules.assessment.learning.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlan;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanSession;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.dto.CurrentSessionResponse;
import com.project_exam.backend.modules.assessment.learning.dto.PlanPartGroupDto;
import com.project_exam.backend.modules.assessment.learning.dto.PlanPhaseDto;
import com.project_exam.backend.modules.assessment.learning.dto.PlanResponse;
import com.project_exam.backend.modules.assessment.learning.dto.PlanTaskDto;
import com.project_exam.backend.modules.assessment.learning.dto.SubmitSessionResponse;
import com.project_exam.backend.modules.assessment.learning.dto.TaskSessionHistoryDto;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper thuần cho sub-module ASSESSMENT/LEARNING.
 * KHÔNG repository/DB/logic: mọi giá trị cần DB hoặc cần tính (tagName, priorityScore,
 * studyResource, các số liệu thống kê, summary, message, list con...)
 * được service resolve rồi truyền vào qua tham số.
 */
@Component
public class LearningMapper {

    // ===================== PlanResponse — đa shape =====================

    /**
     * Shape "generate": dựng từ LearningPlan + dữ liệu chẩn đoán mới sinh.
     * Tương ứng LearningPlanService.buildPlanResponse (KHÔNG set replacedByPlanId).
     */
    public PlanResponse toGeneratedPlanResponse(
            LearningPlan plan,
            String readinessLevel,
            String planStage,
            String summary,
            int totalTasks,
            int passedTasks,
            int estimatedDaysRemaining,
            List<PlanTaskDto> tasks,
            List<PlanPartGroupDto> partGroups,
            List<String> partsWithoutTasks) {
        return PlanResponse.builder()
                .learningPlanId(plan.getLearningPlanId())
                .userId(plan.getUserId())
                .examTypeId(plan.getExamTypeId())
                .sourceUserTestId(plan.getSourceUserTestId())
                .userTargetId(plan.getUserTargetId())
                .targetScore(plan.getTargetScore())
                .deadlineDays(plan.getDeadlineDays())
                .baselineReadiness(plan.getBaselineReadiness())
                .readinessLevel(readinessLevel)
                .diagnosticUserTestId(plan.getSourceUserTestId())
                .planSequence(plan.getPlanSequence())
                .planStage(planStage)
                .passAccuracyDefault(plan.getPassAccuracyDefault())
                .status(plan.getStatus().name())
                .targetAchieved(false)
                .createdAt(plan.getCreatedAt())
                .summary(summary)
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .estimatedDaysRemaining(estimatedDaysRemaining)
                .tasks(tasks)
                .partGroups(partGroups)
                .partsWithoutTasks(partsWithoutTasks)
                .phases(List.of())
                .build();
    }

    /**
     * Shape "from entity": dựng lại từ LearningPlan đã lưu (getPlan/switchPlan).
     * Có set replacedByPlanId; partsWithoutTasks luôn rỗng.
     */
    public PlanResponse toPlanResponseFromEntity(
            LearningPlan plan,
            String readinessLevel,
            String planStage,
            String summary,
            int totalTasks,
            int passedTasks,
            int estimatedDaysRemaining,
            List<PlanTaskDto> tasks,
            List<PlanPartGroupDto> partGroups) {
        return PlanResponse.builder()
                .learningPlanId(plan.getLearningPlanId())
                .userId(plan.getUserId())
                .examTypeId(plan.getExamTypeId())
                .sourceUserTestId(plan.getSourceUserTestId())
                .userTargetId(plan.getUserTargetId())
                .targetScore(plan.getTargetScore())
                .deadlineDays(plan.getDeadlineDays())
                .baselineReadiness(plan.getBaselineReadiness())
                .readinessLevel(readinessLevel)
                .diagnosticUserTestId(plan.getSourceUserTestId())
                .planSequence(plan.getPlanSequence())
                .replacedByPlanId(plan.getReplacedByPlanId())
                .planStage(planStage)
                .passAccuracyDefault(plan.getPassAccuracyDefault())
                .status(plan.getStatus().name())
                .targetAchieved(false)
                .createdAt(plan.getCreatedAt())
                .summary(summary)
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .estimatedDaysRemaining(estimatedDaysRemaining)
                .tasks(tasks)
                .partGroups(partGroups)
                .partsWithoutTasks(List.of())
                .phases(List.of())
                .build();
    }

    /**
     * Shape "target achieved": mock đã đạt target — không tạo plan mới.
     * Chỉ set vài field motivation, các list đều rỗng.
     */
    public PlanResponse toTargetAchievedResponse(
            String userId,
            String examTypeId,
            int baselineReadiness,
            String readinessLevel,
            String summary) {
        return PlanResponse.builder()
                .userId(userId)
                .examTypeId(examTypeId)
                .targetAchieved(true)
                .baselineReadiness(baselineReadiness)
                .readinessLevel(readinessLevel)
                .summary(summary)
                .tasks(List.of())
                .partGroups(List.of())
                .partsWithoutTasks(List.of())
                .phases(List.of())
                .build();
    }

    // ===================== PlanTaskDto / PlanPartGroupDto =====================

    /**
     * tagName (display name khác nhau giữa service), priorityScore, studyResource
     * đều do service resolve rồi truyền vào.
     */
    public PlanTaskDto toTaskDto(
            LearningPlanTask task,
            String taskType,
            String tagName,
            String examPartName,
            PlanPhaseDto.RecommendedResourceDto studyResource,
            int priorityScore) {
        return PlanTaskDto.builder()
                .taskId(task.getTaskId())
                .taskOrder(task.getTaskOrder())
                .taskType(taskType)
                .targetQuestionCount(task.getTargetQuestionCount())
                .tagId(task.getTagId())
                .tagName(tagName)
                .examPartId(task.getExamPartId())
                .examPartName(examPartName)
                .status(task.getStatus().name())
                .passAccuracy(task.getPassAccuracy())
                .baselineAccuracy(task.getBaselineAccuracy())
                .bestAccuracy(task.getBestAccuracy())
                .attemptCount(task.getAttemptCount())
                .studyResource(studyResource)
                .priorityScore(priorityScore)
                .wrongCountAtDiagnosis(task.getWrongCountAtDiagnosis())
                .build();
    }

    public PlanPartGroupDto toPartGroup(
            String examPartId,
            String examPartName,
            Integer displayOrder,
            Integer passAccuracy,
            int passedTasksInPart,
            int totalTasksInPart,
            List<PlanPhaseDto.RecommendedResourceDto> partResources,
            List<PlanTaskDto> tasks) {
        return PlanPartGroupDto.builder()
                .examPartId(examPartId)
                .examPartName(examPartName)
                .displayOrder(displayOrder)
                .passAccuracy(passAccuracy)
                .passedTasksInPart(passedTasksInPart)
                .totalTasksInPart(totalTasksInPart)
                .partResources(partResources)
                .tasks(tasks)
                .build();
    }

    public PlanPhaseDto.RecommendedResourceDto toResourceDto(RecoveryResource r) {
        return PlanPhaseDto.RecommendedResourceDto.builder()
                .resourceId(r.getResourceId())
                .title(r.getTitle())
                .description(r.getDescription())
                .url(r.getUrl())
                .originalFileName(r.getOriginalFileName())
                .build();
    }

    // ===================== QuestionResponse (test.dto — shape của learning) =====================

    /** Chỉ set đúng các field learning cần; KHÔNG đụng test/mapper hay exam/mapper. */
    public QuestionResponse toQuestionResponse(Question q, List<AnswerResponse> answers) {
        return QuestionResponse.builder()
                .questionId(q.getQuestionId())
                .questionNumber(q.getQuestionNumber())
                .examPartId(q.getExamPartId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .isBank(q.getIsBank())
                .answers(answers)
                .build();
    }

    // ===================== CurrentSessionResponse — đa shape =====================

    public CurrentSessionResponse toReviewResponse(
            LearningPlan plan,
            LearningPlanSession lastSubmitted,
            int correctCount,
            int totalCount,
            int accuracy,
            boolean passed,
            String message,
            List<SubmitSessionResponse.ReviewItem> lastReviewItems) {
        return CurrentSessionResponse.builder()
                .mode("REVIEW")
                .learningPlanId(plan.getLearningPlanId())
                .planStage(plan.getPlanStage() != null ? plan.getPlanStage().name() : null)
                .sessionId(lastSubmitted.getSessionId())
                .totalTasks(null)
                .passedTasks(null)
                .correctCount(correctCount)
                .totalCount(totalCount)
                .accuracy(accuracy)
                .passed(passed)
                .message(message)
                .lastReviewItems(lastReviewItems)
                .build();
    }

    public CurrentSessionResponse toQuizSessionResponse(
            LearningPlan plan,
            String planStage,
            LearningPlanSession session,
            PlanTaskDto activeTask,
            PlanPhaseDto.RecommendedResourceDto resource,
            int passAccuracyRequired,
            List<QuestionResponse> questions,
            int totalTasks,
            int passedTasks,
            String message) {
        return CurrentSessionResponse.builder()
                .mode("QUIZ")
                .learningPlanId(plan.getLearningPlanId())
                .planStage(planStage)
                .sessionId(session.getSessionId())
                .sessionStatus(session.getStatus().name())
                .activeTask(activeTask)
                .resource(resource)
                .questionCount(session.getQuestionCount())
                .passAccuracyRequired(passAccuracyRequired)
                .questions(questions)
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .message(message)
                .build();
    }

    public CurrentSessionResponse toMockStageResponse(
            LearningPlan plan,
            String planStage,
            int totalTasks,
            int passedTasks,
            String message) {
        return CurrentSessionResponse.builder()
                .mode("MOCK")
                .learningPlanId(plan.getLearningPlanId())
                .examTypeId(plan.getExamTypeId())
                .planStage(planStage)
                .sessionStatus(null)
                .questions(List.of())
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .message(message)
                .build();
    }

    public CurrentSessionResponse toPickResponse(
            LearningPlan plan,
            String planStage,
            List<PlanPartGroupDto> partGroups,
            List<PlanTaskDto> tasks,
            int totalTasks,
            int passedTasks,
            String message) {
        return CurrentSessionResponse.builder()
                .mode("PICK")
                .learningPlanId(plan.getLearningPlanId())
                .examTypeId(plan.getExamTypeId())
                .planStage(planStage)
                .partGroups(partGroups)
                .tasks(tasks)
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .questions(List.of())
                .message(message)
                .build();
    }

    // ===================== SubmitSessionResponse + nested =====================

    public SubmitSessionResponse toSubmitSessionResponse(
            String sessionId,
            int correctCount,
            int totalCount,
            int accuracy,
            boolean passed,
            String taskStatus,
            String planStage,
            String message,
            List<SubmitSessionResponse.ReviewItem> reviewItems) {
        return SubmitSessionResponse.builder()
                .sessionId(sessionId)
                .correctCount(correctCount)
                .totalCount(totalCount)
                .accuracy(accuracy)
                .passed(passed)
                .taskStatus(taskStatus)
                .planStage(planStage)
                .unlockedNextTask(false)
                .message(message)
                .reviewItems(reviewItems)
                .build();
    }

    public SubmitSessionResponse.ReviewAnswer toReviewAnswer(Answer a) {
        return SubmitSessionResponse.ReviewAnswer.builder()
                .answerId(a.getAnswerId())
                .answerText(a.getAnswerText())
                .answerLabel(a.getAnswerLabel())
                .isCorrect(Boolean.TRUE.equals(a.getIsCorrect()))
                .build();
    }

    public SubmitSessionResponse.ReviewItem toReviewItem(
            Question q,
            List<SubmitSessionResponse.ReviewAnswer> answers,
            String selectedAnswerId,
            List<String> selectedAnswerIds,
            String correctAnswerId,
            boolean isCorrect) {
        return SubmitSessionResponse.ReviewItem.builder()
                .questionId(q.getQuestionId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType() != null ? q.getQuestionType().name() : null)
                .answers(answers)
                .selectedAnswerId(selectedAnswerId)
                .selectedAnswerIds(selectedAnswerIds)
                .correctAnswerId(correctAnswerId)
                .isCorrect(isCorrect)
                .explanation(q.getExplanation())
                .build();
    }

    // ===================== TaskSessionHistoryDto =====================

    public TaskSessionHistoryDto toTaskSessionHistory(LearningPlanSession s) {
        return TaskSessionHistoryDto.builder()
                .sessionId(s.getSessionId())
                .planStage(s.getPlanStage() != null ? s.getPlanStage().name() : null)
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .questionCount(s.getQuestionCount())
                .accuracy(s.getAccuracy())
                .passed(s.getPassed())
                .startedAt(s.getStartedAt())
                .submittedAt(s.getSubmittedAt())
                .build();
    }
}
