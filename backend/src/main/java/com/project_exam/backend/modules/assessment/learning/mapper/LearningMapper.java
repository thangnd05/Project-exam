package com.project_exam.backend.modules.assessment.learning.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlan;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanSession;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.dto.CurrentSessionResponse;
import com.project_exam.backend.modules.assessment.learning.dto.PlanPartGroupDto;
import com.project_exam.backend.modules.assessment.learning.dto.RecommendedResourceDto;
import com.project_exam.backend.modules.assessment.learning.dto.PlanResponse;
import com.project_exam.backend.modules.assessment.learning.dto.PlanTaskDto;
import com.project_exam.backend.modules.assessment.learning.dto.SubmitSessionResponse;
import com.project_exam.backend.modules.assessment.learning.dto.TaskSessionHistoryDto;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LearningMapper {

    public PlanResponse toGeneratedPlanResponse(
            LearningPlan plan,
            String readinessLevel,
            String planStage,
            int totalTasks,
            int passedTasks,
            List<PlanPartGroupDto> partGroups,
            List<String> partsWithoutTasks) {
        return PlanResponse.builder()
                .learningPlanId(plan.getLearningPlanId())
                .userId(plan.getUserId())
                .examTypeId(plan.getExamTypeId())
                .sourceUserTestId(plan.getSourceUserTestId())
                .userTargetId(plan.getUserTargetId())
                .targetScore(plan.getTargetScore())
                .baselineReadiness(plan.getBaselineReadiness())
                .readinessLevel(readinessLevel)
                .planSequence(plan.getPlanSequence())
                .planStage(planStage)
                .status(plan.getStatus().name())
                .targetAchieved(false)
                .createdAt(plan.getCreatedAt())
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .partGroups(partGroups)
                .partsWithoutTasks(partsWithoutTasks)
                .build();
    }

    public PlanResponse toPlanResponseFromEntity(
            LearningPlan plan,
            String readinessLevel,
            String planStage,
            int totalTasks,
            int passedTasks,
            List<PlanPartGroupDto> partGroups) {
        return PlanResponse.builder()
                .learningPlanId(plan.getLearningPlanId())
                .userId(plan.getUserId())
                .examTypeId(plan.getExamTypeId())
                .sourceUserTestId(plan.getSourceUserTestId())
                .userTargetId(plan.getUserTargetId())
                .targetScore(plan.getTargetScore())
                .baselineReadiness(plan.getBaselineReadiness())
                .readinessLevel(readinessLevel)
                .planSequence(plan.getPlanSequence())
                .replacedByPlanId(plan.getReplacedByPlanId())
                .planStage(planStage)
                .status(plan.getStatus().name())
                .targetAchieved(false)
                .createdAt(plan.getCreatedAt())
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .partGroups(partGroups)
                .partsWithoutTasks(List.of())
                .build();
    }

    public PlanResponse toTargetAchievedResponse(
            String userId,
            String examTypeId,
            int baselineReadiness,
            String readinessLevel) {
        return PlanResponse.builder()
                .userId(userId)
                .examTypeId(examTypeId)
                .targetAchieved(true)
                .baselineReadiness(baselineReadiness)
                .readinessLevel(readinessLevel)
                .partGroups(List.of())
                .partsWithoutTasks(List.of())
                .build();
    }

    public PlanTaskDto toTaskDto(
            LearningPlanTask task,
            String taskType,
            String tagName,
            String examPartName,
            RecommendedResourceDto studyResource) {
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
            List<RecommendedResourceDto> partResources,
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

    public RecommendedResourceDto toResourceDto(RecoveryResource r) {
        return RecommendedResourceDto.builder()
                .resourceId(r.getResourceId())
                .title(r.getTitle())
                .description(r.getDescription())
                .url(r.getUrl())
                .originalFileName(r.getOriginalFileName())
                .build();
    }

    public QuestionResponse toQuestionResponse(
            Question q, PassageResponse passage, List<AnswerResponse> answers) {
        return QuestionResponse.builder()
                .questionId(q.getQuestionId())
                .questionNumber(q.getQuestionNumber())
                .examPartId(q.getExamPartId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .isBank(q.getIsBank())
                .passage(passage)
                .answers(answers)
                .build();
    }

    public CurrentSessionResponse toReviewResponse(
            LearningPlan plan,
            LearningPlanSession lastSubmitted,
            int correctCount,
            int totalCount,
            int accuracy,
            boolean passed,
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
                .lastReviewItems(lastReviewItems)
                .build();
    }

    public CurrentSessionResponse toQuizSessionResponse(
            LearningPlan plan,
            String planStage,
            LearningPlanSession session,
            PlanTaskDto activeTask,
            RecommendedResourceDto resource,
            int passAccuracyRequired,
            List<QuestionResponse> questions,
            int totalTasks,
            int passedTasks) {
        return CurrentSessionResponse.builder()
                .mode("QUIZ")
                .learningPlanId(plan.getLearningPlanId())
                .planStage(planStage)
                .sessionId(session.getSessionId())
                .activeTask(activeTask)
                .resource(resource)
                .passAccuracyRequired(passAccuracyRequired)
                .questions(questions)
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .build();
    }

    public CurrentSessionResponse toMockStageResponse(
            LearningPlan plan,
            String planStage,
            int totalTasks,
            int passedTasks) {
        return CurrentSessionResponse.builder()
                .mode("MOCK")
                .learningPlanId(plan.getLearningPlanId())
                .examTypeId(plan.getExamTypeId())
                .planStage(planStage)
                .questions(List.of())
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .build();
    }

    public CurrentSessionResponse toPickResponse(
            LearningPlan plan,
            String planStage,
            List<PlanPartGroupDto> partGroups,
            int totalTasks,
            int passedTasks) {
        return CurrentSessionResponse.builder()
                .mode("PICK")
                .learningPlanId(plan.getLearningPlanId())
                .examTypeId(plan.getExamTypeId())
                .planStage(planStage)
                .partGroups(partGroups)
                .totalTasks(totalTasks)
                .passedTasks(passedTasks)
                .questions(List.of())
                .build();
    }

    public SubmitSessionResponse toSubmitSessionResponse(
            String sessionId,
            int correctCount,
            int totalCount,
            int accuracy,
            boolean passed,
            String taskStatus,
            String planStage,
            List<SubmitSessionResponse.ReviewItem> reviewItems) {
        return SubmitSessionResponse.builder()
                .sessionId(sessionId)
                .correctCount(correctCount)
                .totalCount(totalCount)
                .accuracy(accuracy)
                .passed(passed)
                .taskStatus(taskStatus)
                .planStage(planStage)
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

    public TaskSessionHistoryDto toTaskSessionHistory(LearningPlanSession s) {
        return TaskSessionHistoryDto.builder()
                .sessionId(s.getSessionId())
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .questionCount(s.getQuestionCount())
                .accuracy(s.getAccuracy())
                .passed(s.getPassed())
                .startedAt(s.getStartedAt())
                .submittedAt(s.getSubmittedAt())
                .build();
    }
}
