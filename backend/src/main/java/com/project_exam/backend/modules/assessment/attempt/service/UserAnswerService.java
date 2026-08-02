package com.project_exam.backend.modules.assessment.attempt.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.UnauthorizedException;
import com.project_exam.backend.shared.util.AuthUtils;

import com.project_exam.backend.modules.assessment.attempt.dto.ResultSummaryDto;
import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.UserAnswerResponse;
import com.project_exam.backend.modules.assessment.attempt.mapper.UserAnswerMapper;
import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.util.AnswerGradingUtil;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestStatus;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.util.AttemptTimeUtil;
import org.springframework.transaction.annotation.Transactional;
import com.project_exam.backend.modules.users.user.repository.*;
import com.project_exam.backend.modules.users.rbac.repository.*;
import com.project_exam.backend.modules.posts.post.repository.*;
import com.project_exam.backend.modules.posts.comment.repository.*;
import com.project_exam.backend.modules.posts.category.repository.*;
import com.project_exam.backend.modules.posts.react.repository.*;
import com.project_exam.backend.modules.posts.saved.repository.*;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.album.repository.*;
import com.project_exam.backend.modules.vocabulary.word.repository.*;
import com.project_exam.backend.modules.vocabulary.learning.repository.*;
import com.project_exam.backend.modules.classroom.clazz.repository.*;
import com.project_exam.backend.modules.classroom.chapter.repository.*;
import com.project_exam.backend.modules.classroom.member.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserAnswerService {
    private final UserAnswerRepository userAnswerRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserTestRepository userTestRepository;
    private final TestRepository testRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final AuthUtils authUtils;
    private final UserAnswerMapper userAnswerMapper;

    private UserAnswerResponse toResponse(UserAnswer userAnswer) {
        return userAnswerMapper.toResponse(userAnswer);
    }

    public List<UserAnswer> findAll() {
        return userAnswerRepository.findAll();
    }

    public List<UserAnswerResponse> findAllResponses(jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (!authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) {
            throw new ForbiddenException("Chỉ admin được xem toàn bộ đáp án.");
        }
        return findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public Optional<UserAnswer> findById(String id) {
        return userAnswerRepository.findById(id);
    }

    public Optional<UserAnswerResponse> findResponseById(String id, jakarta.servlet.http.HttpServletRequest httpRequest) {
        return findById(id).map(ua -> {
            if (!authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) {
                UserTest ut = userTestRepository.findById(ua.getUserTestId())
                        .orElseThrow(() -> new NotFoundException("UserTest not found"));
                String currentUserId = authUtils.getUserId(httpRequest);
                boolean isAttemptOwner = currentUserId != null && currentUserId.equals(ut.getUserId());
                boolean isTestOwner = false;
                if (!isAttemptOwner && currentUserId != null) {
                    Test test = testRepository.findById(ut.getTestId()).orElse(null);
                    isTestOwner = test != null && currentUserId.equals(test.getCreatedBy());
                }
                if (!isAttemptOwner && !isTestOwner) {
                    throw new ForbiddenException("Bạn không có quyền xem đáp án này.");
                }
            }
            return toResponse(ua);
        });
    }

    public List<UserAnswer> findByUserTestId(String userTestId) {
        return userAnswerRepository.findByUserTestId(userTestId);
    }

    public List<UserAnswerResponse> findResponsesByUserTestId(String userTestId, jakarta.servlet.http.HttpServletRequest httpRequest) {

        if (!authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) {
            UserTest ut = userTestRepository.findById(userTestId)
                    .orElseThrow(() -> new NotFoundException("UserTest not found"));
            String currentUserId = authUtils.getUserId(httpRequest);
            boolean isAttemptOwner = currentUserId != null && currentUserId.equals(ut.getUserId());
            boolean isTestOwner = false;
            if (!isAttemptOwner && currentUserId != null) {
                Test test = testRepository.findById(ut.getTestId()).orElse(null);
                isTestOwner = test != null && currentUserId.equals(test.getCreatedBy());
            }
            if (!isAttemptOwner && !isTestOwner) {
                throw new ForbiddenException("Bạn không có quyền xem đáp án của bài làm này.");
            }
        }
        return findByUserTestId(userTestId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<UserAnswer> findByQuestionId(String questionId) {
        return userAnswerRepository.findByQuestionId(questionId);
    }

    public List<UserAnswerResponse> findResponsesByQuestionId(String questionId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (!authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) {
            throw new ForbiddenException("Chỉ admin được liệt kê đáp án theo câu hỏi.");
        }
        return findByQuestionId(questionId).stream()
                .map(this::toResponse)
                .toList();
    }

    public UserAnswer save(UserAnswer userAnswer) {
        return userAnswerRepository.save(userAnswer);
    }

    public UserAnswerResponse create(UserAnswerRequest request, String currentUserId) {
        return toResponse(upsertByUserTestAndQuestion(request, currentUserId));
    }

    public UserAnswerResponse update(String id, UserAnswerRequest request, String currentUserId) {
        validateUserAnswerRequest(request);
        validateOwnershipAndInProgress(request.getUserTestId(), currentUserId);

        UserAnswer existing = userAnswerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("UserAnswer not found"));
        if (!Objects.equals(existing.getUserTestId(), request.getUserTestId())) {
            throw new ForbiddenException("Đáp án không thuộc bài làm này.");
        }

        existing.setQuestionId(request.getQuestionId());
        existing.setSelectedAnswerId(request.getSelectedAnswerId());
        existing.setSelectedAnswerIds(AnswerGradingUtil.toCsv(request.getSelectedAnswerIds()));
        existing.setAnswerText(request.getAnswerText());
        return toResponse(save(existing));
    }

    @Transactional
    public List<UserAnswerResponse> upsertBatch(List<UserAnswerRequest> requests, String currentUserId) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        requests.forEach(this::validateUserAnswerRequest);
        requests.stream()
                .map(UserAnswerRequest::getUserTestId)
                .distinct()
                .forEach(userTestId -> validateOwnershipAndInProgress(userTestId, currentUserId));

        return requests.stream()
                .map(this::upsertEntity)
                .map(this::toResponse)
                .toList();
    }

    private UserAnswer upsertByUserTestAndQuestion(UserAnswerRequest request, String currentUserId) {
        validateUserAnswerRequest(request);
        validateOwnershipAndInProgress(request.getUserTestId(), currentUserId);
        return upsertEntity(request);
    }

    private UserAnswer upsertEntity(UserAnswerRequest request) {
        UserAnswer userAnswer = userAnswerRepository
                .findByUserTestIdAndQuestionId(request.getUserTestId(), request.getQuestionId())
                .orElseGet(UserAnswer::new);

        userAnswer.setUserTestId(request.getUserTestId());
        userAnswer.setQuestionId(request.getQuestionId());
        userAnswer.setSelectedAnswerId(request.getSelectedAnswerId());
        userAnswer.setSelectedAnswerIds(AnswerGradingUtil.toCsv(request.getSelectedAnswerIds()));
        userAnswer.setAnswerText(request.getAnswerText());

        return userAnswerRepository.save(userAnswer);
    }

    private void validateUserAnswerRequest(UserAnswerRequest request) {
        if (request == null) {
            throw new BadRequestException("Request không được để trống");
        }
        if (request.getUserTestId() == null || request.getUserTestId().isBlank()) {
            throw new BadRequestException("Thiếu userTestId");
        }
        if (request.getQuestionId() == null || request.getQuestionId().isBlank()) {
            throw new BadRequestException("Thiếu questionId");
        }
    }

    private void validateOwnershipAndInProgress(String userTestId, String currentUserId) {
        if (currentUserId == null || currentUserId.isBlank()) {
            throw new UnauthorizedException("Unauthorized");
        }

        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));

        if (!currentUserId.equals(userTest.getUserId())) {
            throw new ForbiddenException("Bạn không có quyền truy cập bài thi này");
        }

        if (userTest.getStatus() != UserTest.Status.IN_PROGRESS) {
            throw new ConflictException("Bài thi đã nộp, không thể sửa đáp án");
        }

        assertWithinTimeLimit(userTest);
    }

    private void assertWithinTimeLimit(UserTest userTest) {
        Integer durationMinutes = testRepository.findById(userTest.getTestId())
                .map(Test::getDurationMinutes)
                .orElse(null);
        if (AttemptTimeUtil.isExpired(userTest, durationMinutes, Instant.now())) {
            throw new ConflictException("Đã hết giờ làm bài, không thể sửa đáp án");
        }
    }

    @Transactional
    public List<UserAnswerResponse> upsertBatchForGuest(List<UserAnswerRequest> requests, String guestSessionId) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        requests.forEach(this::validateUserAnswerRequest);
        requests.stream()
                .map(UserAnswerRequest::getUserTestId)
                .distinct()
                .forEach(userTestId -> validateGuestOwnershipAndInProgress(userTestId, guestSessionId));

        return requests.stream()
                .map(this::upsertEntity)
                .map(this::toResponse)
                .toList();
    }

    private void validateGuestOwnershipAndInProgress(String userTestId, String guestSessionId) {
        if (guestSessionId == null || guestSessionId.isBlank()) {
            throw new BadRequestException("Thiếu guest session id");
        }
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));
        if (userTest.getGuestSessionId() == null
                || !userTest.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }
        if (userTest.getStatus() != UserTest.Status.IN_PROGRESS) {
            throw new ConflictException("Bài thi đã nộp, không thể sửa đáp án");
        }

        assertWithinTimeLimit(userTest);
    }

    public ResultSummaryDto getGuestResultSummary(String userTestId, String guestSessionId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));
        if (userTest.getGuestSessionId() == null
                || !userTest.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }

        if (userTest.getStatus() != UserTest.Status.COMPLETED) {
            return new ResultSummaryDto(0, 0, 0, 0);
        }

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTestId);
        if (userAnswers.isEmpty()) {

            long total = getTotalQuestionsForResult(userTest);
            return new ResultSummaryDto(0, total, total, userTest.getTotalScore());
        }
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);

        Set<String> questionIds = uniqueAnswers.stream()
                .map(UserAnswer::getQuestionId)
                .collect(Collectors.toSet());

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        Map<String, List<Answer>> correctAnswersMap = answerRepository
                .findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        long correctCount = 0;
        for (UserAnswer userAnswer : uniqueAnswers) {
            String qId = userAnswer.getQuestionId();
            Question question = questionMap.get(qId);
            List<Answer> correctAnswers = correctAnswersMap.get(qId);
            if (question == null || correctAnswers == null || correctAnswers.isEmpty()) continue;

            if (AnswerGradingUtil.isCorrect(question.getQuestionType(),
                    userAnswer.getSelectedAnswerId(), userAnswer.getSelectedAnswerIds(),
                    userAnswer.getAnswerText(), correctAnswers)) {
                correctCount++;
            }
        }

        long totalQuestions = getTotalQuestionsForResult(userTest);
        long normalizedCorrectCount = Math.min(correctCount, totalQuestions);
        long wrongCount = Math.max(totalQuestions - normalizedCorrectCount, 0);
        return new ResultSummaryDto(normalizedCorrectCount, wrongCount, totalQuestions, userTest.getTotalScore());
    }

    public List<UserAnswerResponse> findResponsesByUserTestIdForGuest(String userTestId, String guestSessionId) {
        UserTest ut = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));
        if (ut.getGuestSessionId() == null || !ut.getGuestSessionId().equals(guestSessionId)) {
            throw new ForbiddenException("Phiên guest không hợp lệ.");
        }
        return findByUserTestId(userTestId).stream()
                .map(this::toResponse)
                .toList();
    }

    public boolean delete(String id, jakarta.servlet.http.HttpServletRequest httpRequest) {
        return userAnswerRepository.findById(id).map(u -> {

            if (!authUtils.hasPermission(PermissionCatalog.ATTEMPT_MANAGE)) {
                String currentUserId = authUtils.getUserId(httpRequest);
                UserTest ut = userTestRepository.findById(u.getUserTestId())
                        .orElseThrow(() -> new NotFoundException("UserTest not found"));
                if (currentUserId == null || !currentUserId.equals(ut.getUserId())) {
                    throw new ForbiddenException("Bạn không có quyền xoá đáp án này.");
                }
            }
            userAnswerRepository.delete(u);
            return true;
        }).orElse(false);
    }

    public ResultSummaryDto getResultSummary(String userTestId, String currentUserId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("UserTest not found"));
        if (!Objects.equals(userTest.getUserId(), currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền xem kết quả bài thi này");
        }

        Test test = testRepository.findById(userTest.getTestId())
            .orElseThrow(() -> new NotFoundException("Test not found"));

        boolean isUnlimited = test.getAvailableTo() == null;
        boolean isEnded = test.calculateStatus() == TestStatus.ENDED;

        if (!isUnlimited && !isEnded) {
            return new ResultSummaryDto(0, 0, 0, 0);
        }

        List<UserAnswer> userAnswers = userAnswerRepository.findByUserTestId(userTestId);
        if (userAnswers.isEmpty()) {

            long total = getTotalQuestionsForResult(userTest);
            return new ResultSummaryDto(0, total, total, userTest.getTotalScore());
        }
        List<UserAnswer> uniqueAnswers = deduplicateByQuestionId(userAnswers);

        Set<String> questionIds = uniqueAnswers.stream()
                .map(UserAnswer::getQuestionId)
                .collect(Collectors.toSet());

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        Map<String, List<Answer>> correctAnswersMap = answerRepository.findByQuestionIdInAndIsCorrectTrue(new ArrayList<>(questionIds))
                .stream()
                .collect(Collectors.groupingBy(Answer::getQuestionId));

        long correctCount = 0;
        for (UserAnswer userAnswer : uniqueAnswers) {
            String qId = userAnswer.getQuestionId();
            Question question = questionMap.get(qId);
            List<Answer> correctAnswers = correctAnswersMap.get(qId);

            if (question == null || correctAnswers == null || correctAnswers.isEmpty()) continue;

            if (AnswerGradingUtil.isCorrect(question.getQuestionType(),
                    userAnswer.getSelectedAnswerId(), userAnswer.getSelectedAnswerIds(),
                    userAnswer.getAnswerText(), correctAnswers)) {
                correctCount++;
            }
        }

        long totalQuestions = getTotalQuestionsForResult(userTest);
        long normalizedCorrectCount = Math.min(correctCount, totalQuestions);
        long wrongCount = Math.max(totalQuestions - normalizedCorrectCount, 0);
        return new ResultSummaryDto(normalizedCorrectCount, wrongCount, totalQuestions, userTest.getTotalScore());
    }

    private long getTotalQuestionsForResult(UserTest userTest) {
        Set<String> practicePartIds = userTest.isPractice()
                ? parsePracticePartIds(userTest.getPracticePartIds())
                : Collections.emptySet();

        List<String> testPartIds = testPartRepository.findByTestId(userTest.getTestId()).stream()
                .filter(tp -> practicePartIds.isEmpty() || practicePartIds.contains(tp.getExamPartId()))
                .map(testPart -> testPart.getTestPartId())
                .toList();
        if (testPartIds.isEmpty()) {
            return 0;
        }
        return testQuestionRepository.findByTestPartIdIn(testPartIds).stream()
                .map(TestQuestion::getQuestionId)
                .distinct()
                .count();
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
        for (UserAnswer userAnswer : userAnswers) {
            if (userAnswer.getQuestionId() == null) {
                continue;
            }
            uniqueByQuestionId.putIfAbsent(userAnswer.getQuestionId(), userAnswer);
        }
        return new ArrayList<>(uniqueByQuestionId.values());
    }

}
