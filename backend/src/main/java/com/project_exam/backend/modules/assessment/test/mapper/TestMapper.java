package com.project_exam.backend.modules.assessment.test.mapper;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionGroupAdminResponse;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionGroupResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuickChallengeCardResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartSimpleResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestQuestionResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TestMapper {

    public QuickChallengeCardResponse.PartSummary toPartSummary(String name, int numQuestions, int displayOrder) {
        return QuickChallengeCardResponse.PartSummary.builder()
                .name(name)
                .numQuestions(numQuestions)
                .displayOrder(displayOrder)
                .build();
    }

    public QuickChallengeCardResponse toQuickChallengeCard(
            Test test, String examTypeName, String examTypeImageUrl, String status, int totalQuestions,
            List<QuickChallengeCardResponse.PartSummary> parts) {
        return QuickChallengeCardResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .durationMinutes(test.getDurationMinutes())
                .bannerUrl(test.getBannerUrl())
                .examTypeId(test.getExamTypeId())
                .examTypeName(examTypeName != null ? examTypeName : "Khác")
                .examTypeImageUrl(examTypeImageUrl)
                .status(status)
                .totalQuestions(totalQuestions)
                .parts(parts)
                .build();
    }

    public TestResponse toSummaryResponse(
            Test test, Integer maxAttempts, int attemptsUsed, Integer remainingAttempts,
            long totalAttempts, boolean canDoTest, boolean owned, boolean locked, String status) {
        return TestResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .collectionId(test.getCollectionId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(status)
                .maxAttempts(maxAttempts)
                .attemptsUsed(attemptsUsed)
                .remainingAttempts(remainingAttempts)
                .totalAttempts(totalAttempts)
                .canDoTest(canDoTest)
                .costCoins(test.getCostCoins())
                .owned(owned)
                .locked(locked)
                .parts(null)
                .build();
    }

    public TestResponse toLoginRequiredResponse(Test test, String status, boolean canDoTest) {
        return TestResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .status(status)
                .canDoTest(canDoTest)
                .build();
    }

    public TestResponse toPaymentRequiredResponse(
            Test test, String status, boolean canDoTest, boolean owned, boolean locked) {
        return TestResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .collectionId(test.getCollectionId())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .createdBy(test.getCreatedBy())
                .status(status)
                .canDoTest(canDoTest)
                .costCoins(test.getCostCoins())
                .owned(owned)
                .locked(locked)
                .build();
    }

    public TestResponse toFullResponse(
            Test test, Integer maxAttempts, int attemptsUsed, Integer remaining,
            long totalAttempts, boolean canDoTest, boolean owned, boolean locked,
            String status, List<TestPartResponse> partResponses) {
        return TestResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .collectionId(test.getCollectionId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .classId(test.getClassId())
                .chapterId(test.getChapterId())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(status)
                .maxAttempts(maxAttempts)
                .attemptsUsed(attemptsUsed)
                .remainingAttempts(remaining)
                .totalAttempts(totalAttempts)
                .canDoTest(canDoTest)
                .costCoins(test.getCostCoins())
                .owned(owned)
                .locked(locked)
                .parts(partResponses)
                .build();
    }

    public TestResponse toEmptyResponse(
            Test test, Integer maxAttempts, int attemptsUsed, Integer remaining,
            long totalAttempts, boolean canDoTest, boolean owned, boolean locked,
            String status, List<TestPartResponse> partResponses) {
        return TestResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .collectionId(test.getCollectionId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(status)
                .maxAttempts(maxAttempts)
                .attemptsUsed(attemptsUsed)
                .remainingAttempts(remaining)
                .totalAttempts(totalAttempts)
                .canDoTest(canDoTest)
                .costCoins(test.getCostCoins())
                .owned(owned)
                .locked(locked)
                .parts(partResponses)
                .build();
    }

    public TestResponse toLimitExceededResponse(
            Test test, int used, Integer rem, long total, String status,
            boolean canDoTest, boolean owned, boolean locked) {
        return TestResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examCategoryId(test.getExamCategoryId())
                .collectionId(test.getCollectionId())
                .classId(test.getClassId())
                .chapterId(test.getChapterId())
                .status(status)
                .maxAttempts(test.getMaxAttempts())
                .attemptsUsed(used)
                .remainingAttempts(rem)
                .totalAttempts(total)
                .costCoins(test.getCostCoins())
                .owned(owned)
                .locked(locked)
                .canDoTest(canDoTest)
                .build();
    }

    public TestAdminResponse toAdminSummaryResponse(Test test, long totalAttempts, String status) {
        return TestAdminResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .collectionId(test.getCollectionId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(status)
                .maxAttempts(test.getMaxAttempts())
                .totalAttempts(totalAttempts)
                .classId(test.getClassId())
                .parts(null)
                .build();
    }

    public TestAdminResponse toAdminFullResponse(
            Test test, long totalAttempts, String status, List<TestPartAdminResponse> partResponses) {
        return TestAdminResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .collectionId(test.getCollectionId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(status)
                .maxAttempts(test.getMaxAttempts())
                .totalAttempts(totalAttempts)
                .classId(test.getClassId())
                .parts(partResponses)
                .build();
    }

    public TestAdminResponse toAdminEmptyResponse(
            Test test, long totalAttempts, String status, List<TestPartAdminResponse> partResponses) {
        return TestAdminResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .collectionId(test.getCollectionId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(status)
                .maxAttempts(test.getMaxAttempts())
                .totalAttempts(totalAttempts)
                .classId(test.getClassId())
                .parts(partResponses)
                .build();
    }

    public QuestionResponse toQuestionResponse(Question q, String testPartId, List<AnswerResponse> answers) {
        return QuestionResponse.builder()
                .questionId(q.getQuestionId())
                .examPartId(q.getExamPartId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .isBank(q.getIsBank())
                .testPartId(testPartId)
                .answers(answers)
                .build();
    }

    public QuestionGroupResponse toQuestionGroupWithPassage(PassageResponse passage, List<QuestionResponse> questions) {
        return QuestionGroupResponse.builder()
                .passage(passage)
                .questions(questions)
                .build();
    }

    public QuestionGroupResponse toSingleQuestionGroup(List<QuestionResponse> questions) {
        return QuestionGroupResponse.builder()
                .passage(null)
                .questions(questions)
                .build();
    }

    public TestPartResponse toTestPartResponse(
            TestPart tp, String partName, List<QuestionGroupResponse> questionGroups) {
        return TestPartResponse.builder()
                .testPartId(tp.getTestPartId())
                .examPartId(tp.getExamPartId())
                .partName(partName)
                .questionGroups(questionGroups)
                .build();
    }

    public TestPartAdminResponse toTestPartAdminResponse(
            TestPart tp, String partName, List<QuestionGroupAdminResponse> questionGroups) {
        return TestPartAdminResponse.builder()
                .testPartId(tp.getTestPartId())
                .examPartId(tp.getExamPartId())
                .partName(partName)
                .questionGroups(questionGroups)
                .build();
    }

    public QuestionGroupAdminResponse toQuestionGroupAdmin(
            PassageResponse passage, List<QuestionAdminResponse> questions) {
        return QuestionGroupAdminResponse.builder()
                .passage(passage)
                .questions(questions)
                .build();
    }

    public QuestionAdminResponse toQuestionAdminResponse(
            Question q, String examTypeId, List<AnswerAdminResponse> answers) {
        return QuestionAdminResponse.builder()
                .questionId(q.getQuestionId())
                .examPartId(q.getExamPartId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .explanation(q.getExplanation())
                .examTypeId(examTypeId)
                .classId(q.getClassId())
                .isBank(q.getIsBank())
                .answers(answers)
                .build();
    }

    public TestPartSimpleResponse toTestPartSimpleResponse(TestPart testPart) {
        return TestPartSimpleResponse.builder()
                .testPartId(testPart.getTestPartId())
                .testId(testPart.getTestId())
                .examPartId(testPart.getExamPartId())
                .numQuestions(testPart.getNumQuestions())
                .build();
    }

    public TestQuestionResponse toTestQuestionResponse(TestQuestion testQuestion) {
        return TestQuestionResponse.builder()
                .testQuestionId(testQuestion.getTestQuestionId())
                .testPartId(testQuestion.getTestPartId())
                .questionId(testQuestion.getQuestionId())
                .displayOrder(testQuestion.getDisplayOrder())
                .build();
    }
}
