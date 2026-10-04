package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.attempt.service.UserTestService;
import com.project_exam.backend.modules.assessment.exam.domain.ExamCategory;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.domain.Skill;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionGroupAdminResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.PassageMapper;
import com.project_exam.backend.modules.assessment.exam.mapper.PassageMediaMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamCategoryRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.PassageMediaRepository;
import com.project_exam.backend.modules.assessment.exam.repository.PassageRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.SkillRepository;
import com.project_exam.backend.modules.assessment.exam.service.AnswerService;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import com.project_exam.backend.modules.assessment.test.domain.TestStatus;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionGroupResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartSummaryResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.mapper.TestMapper;
import com.project_exam.backend.modules.assessment.test.repository.TestPartRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestQuestionRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TestPaperQueryService {

    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final AnswerService answerService;
    private final ExamPartRepository examPartRepository;
    private final ExamCategoryRepository examCategoryRepository;
    private final SkillRepository skillRepository;
    private final PassageRepository passageRepository;
    private final UserTestRepository userTestRepository;
    private final UserTestService userTestService;
    private final TestAccessService testAccessService;
    private final PassageMapper passageMapper;
    private final PassageMediaRepository passageMediaRepository;
    private final PassageMediaMapper passageMediaMapper;
    private final TestMapper testMapper;

    public Optional<Test> getTestById(String id) {
        return testRepository.findById(id);
    }

    @Transactional
    public TestResponse getTestFullById(String testId, String currentUserId, String attemptId, String guestSessionId) {
        Test test = testRepository.findById(testId).orElseThrow(() -> new NotFoundException("Test not found"));

        boolean isGuest = (currentUserId == null);
        if (isGuest) {
            boolean guestEligible = test.getClassId() == null
                    && test.getExamCategoryId() != null
                    && examCategoryRepository.findById(test.getExamCategoryId())
                            .map(ExamCategory::getGuestAllowed)
                            .orElse(false);
            if (!guestEligible) {
                return testMapper.toLoginRequiredResponse(
                        test, TestStatus.LOGIN_REQUIRED.name(), false);
            }
        }

        boolean paid = test.getCostCoins() != null && test.getCostCoins() > 0;
        if (paid && !testAccessService.hasAccess(test, currentUserId)) {
            return testMapper.toPaymentRequiredResponse(
                    test, "PAYMENT_REQUIRED", false, false, true);
        }

        UserTest latest = isGuest
                ? null
                : userTestRepository.findTopByUserIdAndTestIdOrderByStartedAtDesc(currentUserId, testId).orElse(null);

        if (!isGuest) {
            handleAutoSubmit(test, latest);
        }

        int attemptsUsed = isGuest
                ? 0
                : userTestRepository.countCompletedExcludingMode(
                        currentUserId, testId, UserTest.Status.COMPLETED, UserTest.Mode.PRACTICE);
        Integer maxAttempts = test.getMaxAttempts();
        Integer remaining = (!isGuest && maxAttempts != null) ? Math.max(0, maxAttempts - attemptsUsed) : null;
        long totalAttempts = userTestRepository.countByTestId(testId);

        if (!isGuest && maxAttempts != null && remaining <= 0) {
            return buildLimitExceededResponse(test, attemptsUsed, remaining, totalAttempts);
        }

        TestUserDataBundle data = loadUserTestData(testId);
        if (data.testParts().isEmpty()) {
            return buildEmptyUserTestResponse(test, maxAttempts, attemptsUsed, remaining);
        }

        String orderAttemptId = test.isShuffleQuestions()
                ? resolveOrderAttemptId(testId, currentUserId, attemptId, guestSessionId, latest)
                : null;

        List<TestPartResponse> partResponses = buildUserPartResponses(data, orderAttemptId);

        return buildUserTestResponse(test, maxAttempts, attemptsUsed, remaining, totalAttempts, partResponses);
    }

    public List<TestPartSummaryResponse> getPartsSummary(String testId) {
        testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));

        List<TestPart> testParts = testPartRepository.findByTestId(testId);
        if (testParts.isEmpty()) return Collections.emptyList();

        List<String> testPartIds = testParts.stream().map(TestPart::getTestPartId).toList();
        Map<String, Long> countByTestPartId = testQuestionRepository.findByTestPartIdIn(testPartIds).stream()
                .filter(tq -> tq.getQuestionId() != null)
                .collect(Collectors.groupingBy(TestQuestion::getTestPartId,
                        Collectors.mapping(TestQuestion::getQuestionId,
                                Collectors.collectingAndThen(Collectors.toSet(), s -> (long) s.size()))));

        Set<String> examPartIds = testParts.stream()
                .map(TestPart::getExamPartId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<String, ExamPart> examPartMap = examPartRepository.findAllById(examPartIds).stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, e -> e));
        Set<String> skillIds = examPartMap.values().stream()
                .map(ExamPart::getSkillId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<String, String> skillNames = skillIds.isEmpty()
                ? Collections.emptyMap()
                : skillRepository.findAllById(skillIds).stream()
                        .collect(Collectors.toMap(Skill::getSkillId, Skill::getName));

        return testParts.stream()
                .map(tp -> {
                    ExamPart ep = examPartMap.get(tp.getExamPartId());
                    String skillName = (ep != null && ep.getSkillId() != null)
                            ? skillNames.get(ep.getSkillId()) : null;
                    return TestPartSummaryResponse.builder()
                            .testPartId(tp.getTestPartId())
                            .examPartId(tp.getExamPartId())
                            .partName(ep != null && ep.getName() != null ? ep.getName() : "Phần thi")
                            .skillName(skillName)
                            .questionCount(countByTestPartId.getOrDefault(tp.getTestPartId(), 0L).intValue())
                            .displayOrder(ep != null && ep.getDisplayOrder() != null ? ep.getDisplayOrder() : 999)
                            .build();
                })
                .sorted(Comparator.comparing(TestPartSummaryResponse::getDisplayOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public TestAdminResponse getTestFullByIdAdmin(String testId) {
        return getTestFullByIdAdmin(testId, null);
    }

    public TestAdminResponse getTestFullByIdAdmin(String testId, String orderAttemptId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));
        long totalAttempts = userTestRepository.countByTestId(testId);

        TestAdminDataBundle data = loadAdminTestData(test.getTestId());

        if (data.testParts().isEmpty()) {
            return buildEmptyAdminResponse(test, totalAttempts);
        }

        List<TestPartAdminResponse> partResponses = buildAdminPartResponses(
                data, test.isShuffleQuestions() ? orderAttemptId : null);

        return buildAdminTestResponse(test, totalAttempts, partResponses);
    }

    private String resolveOrderAttemptId(
            String testId, String currentUserId, String attemptId, String guestSessionId, UserTest latest) {
        if (attemptId != null && !attemptId.isBlank()) {
            UserTest requested = userTestRepository.findById(attemptId).orElse(null);
            if (requested != null && testId.equals(requested.getTestId())) {
                boolean ownUser = currentUserId != null && currentUserId.equals(requested.getUserId());
                boolean ownGuest = currentUserId == null && guestSessionId != null && !guestSessionId.isBlank()
                        && guestSessionId.equals(requested.getGuestSessionId());
                if (ownUser || ownGuest) {
                    return requested.getUserTestId();
                }
            }
        }
        if (latest != null && latest.getStatus() == UserTest.Status.IN_PROGRESS) {
            return latest.getUserTestId();
        }
        return null;
    }

    public static List<TestQuestion> orderPartQuestions(
            String testPartId, List<TestQuestion> ordered, Map<String, Question> questionMap, String orderAttemptId) {
        return TestQuestionOrdering.order(
                ordered,
                qid -> Optional.ofNullable(questionMap.get(qid)).map(Question::getPassageId).orElse(null),
                orderAttemptId != null ? TestQuestionOrdering.attemptRandom(orderAttemptId, testPartId) : null);
    }

    private List<TestPartResponse> buildUserPartResponses(TestUserDataBundle data, String orderAttemptId) {
        return data.testParts().stream().map(tp -> {
            List<TestQuestion> tqList = orderPartQuestions(
                    tp.getTestPartId(),
                    data.questionsByPartId().getOrDefault(tp.getTestPartId(), Collections.emptyList()),
                    data.questionMap(),
                    orderAttemptId);

            Map<String, QuestionGroupResponse> groupsMap = new LinkedHashMap<>();

            for (TestQuestion tq : tqList) {
                Question q = data.questionMap().get(tq.getQuestionId());
                if (q == null) continue;

                QuestionResponse qDto = testMapper.toQuestionResponse(
                        q, tp.getTestPartId(),
                        data.answersByQuestionId().getOrDefault(q.getQuestionId(), Collections.emptyList()));

                if (q.getPassageId() != null) {
                    String groupKey = "P_" + q.getPassageId();
                    if (!groupsMap.containsKey(groupKey)) {
                        Passage p = data.passageMap().get(q.getPassageId());

                        PassageResponse pDto = (p != null)
                                ? passageMapper.toResponse(
                                        p,
                                        data.passageMediaByPassageId()
                                                .getOrDefault(p.getPassageId(), Collections.emptyList()),
                                        false)
                                : null;
                        groupsMap.put(groupKey, testMapper.toQuestionGroupWithPassage(pDto, new ArrayList<>()));
                    }
                    groupsMap.get(groupKey).getQuestions().add(qDto);
                } else {
                    groupsMap.put("Q_" + q.getQuestionId(),
                            testMapper.toSingleQuestionGroup(new ArrayList<>(List.of(qDto))));
                }
            }

            List<QuestionGroupResponse> finalGroups = new ArrayList<>(groupsMap.values());
            String partName = data.examPartNameById().get(tp.getExamPartId());
            return testMapper.toTestPartResponse(tp, partName, finalGroups);
        }).toList();
    }

    private TestResponse buildUserTestResponse(
            Test test, Integer maxAttempts, int attemptsUsed, Integer remaining,
            long totalAttempts, List<TestPartResponse> partResponses) {

        return testMapper.toFullResponse(
                test, maxAttempts, attemptsUsed, remaining, totalAttempts,
                true, true, false, test.calculateStatus().name(), partResponses);
    }

    private TestResponse buildEmptyUserTestResponse(Test test, Integer maxAttempts, int attemptsUsed, Integer remaining) {
        long totalAttempts = userTestRepository.countByTestId(test.getTestId());
        return testMapper.toEmptyResponse(
                test, maxAttempts, attemptsUsed, remaining, totalAttempts,
                true, true, false, test.calculateStatus().name(), Collections.emptyList());
    }

    private void handleAutoSubmit(Test test, UserTest latest) {
        Integer duration = test.getDurationMinutes();
        // Luyện tập không giới hạn giờ nên không tự nộp theo thời lượng đề.
        if (latest != null && latest.getStatus() == UserTest.Status.IN_PROGRESS && !latest.isPractice()
                && duration != null && duration > 0) {
            Instant endTime = latest.getStartedAt().plus(Duration.ofMinutes(duration));
            if (test.getAvailableTo() != null && test.getAvailableTo().isBefore(endTime)) endTime = test.getAvailableTo();

            if (!Instant.now().isBefore(endTime)) {
                try {
                    userTestService.submitTest(latest.getUserTestId(), latest.getUserId());
                } catch (Exception e) {
                    latest.setStatus(UserTest.Status.COMPLETED);
                    latest.setFinishedAt(endTime);
                    userTestRepository.save(latest);
                }
            }
        }
    }

    private TestResponse buildLimitExceededResponse(Test test, int used, Integer rem, long total) {
        return testMapper.toLimitExceededResponse(
                test, used, rem, total, "FORBIDDEN", false, true, false);
    }

    private TestUserDataBundle loadUserTestData(String testId) {
        List<TestPart> testParts = testPartRepository.findByTestIdOrderByExamPartDisplayOrder(testId);
        if (testParts.isEmpty()) {
            return new TestUserDataBundle(
                    Collections.emptyList(),
                    Collections.emptyMap(),
                    Collections.emptyMap(),
                    Collections.emptyMap(),
                    Collections.emptyMap(),
                    Collections.emptyMap(),
                    Collections.emptyMap()
            );
        }

        List<String> partIds = testParts.stream().map(TestPart::getTestPartId).toList();
        List<TestQuestion> allQuestions = testQuestionRepository.findByTestPartIdInOrderByDisplayOrder(partIds);
        Map<String, List<TestQuestion>> questionsByPartId = allQuestions.stream()
                .collect(Collectors.groupingBy(TestQuestion::getTestPartId));

        List<String> questionIds = allQuestions.stream()
                .map(TestQuestion::getQuestionId).distinct().toList();

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        Set<String> passageIds = questionMap.values().stream()
                .map(Question::getPassageId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, Passage> passageMap = passageIds.isEmpty()
                ? Collections.emptyMap()
                : passageRepository.findAllById(passageIds).stream()
                        .collect(Collectors.toMap(Passage::getPassageId, p -> p));

        Map<String, List<PassageMediaResponse>> passageMediaByPassageId =
                loadPassageMediaByPassageId(passageIds);

        Map<String, String> examPartNameById = loadExamPartNames(testParts);

        Map<String, List<AnswerResponse>> answersByQuestionId =
                answerService.getAnswersForMultipleQuestions(questionIds);

        return new TestUserDataBundle(
                testParts, questionsByPartId, questionMap, passageMap,
                answersByQuestionId, passageMediaByPassageId, examPartNameById
        );
    }

    private Map<String, String> loadExamPartNames(List<TestPart> testParts) {
        Set<String> examPartIds = testParts.stream()
                .map(TestPart::getExamPartId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (examPartIds.isEmpty()) return Collections.emptyMap();
        return examPartRepository.findAllById(examPartIds).stream()
                .filter(e -> e.getName() != null)
                .collect(Collectors.toMap(ExamPart::getExamPartId, ExamPart::getName));
    }

    private TestAdminDataBundle loadAdminTestData(String testId) {
        List<TestPart> testParts = testPartRepository.findByTestIdOrderByExamPartDisplayOrder(testId);
        if (testParts.isEmpty()) {
            return new TestAdminDataBundle(
                    Collections.emptyList(),
                    Collections.emptyMap(),
                    Collections.emptyMap(),
                    Collections.emptyMap(),
                    Collections.emptyMap(),
                    Collections.emptyMap(),
                    Collections.emptyMap()
            );
        }

        List<String> partIds = testParts.stream().map(TestPart::getTestPartId).toList();
        List<TestQuestion> allQuestions = testQuestionRepository.findByTestPartIdInOrderByDisplayOrder(partIds);
        Map<String, List<TestQuestion>> questionsByPartId = allQuestions.stream()
                .collect(Collectors.groupingBy(TestQuestion::getTestPartId));

        List<String> questionIds = allQuestions.stream()
                .map(TestQuestion::getQuestionId).distinct().toList();

        Map<String, Question> questionMap = questionRepository.findAllById(questionIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        Set<String> passageIds = questionMap.values().stream()
                .map(Question::getPassageId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, Passage> passageMap = passageRepository.findAllById(passageIds).stream()
                .collect(Collectors.toMap(Passage::getPassageId, p -> p));

        Map<String, List<PassageMediaResponse>> passageMediaByPassageId =
                loadPassageMediaByPassageId(passageIds);

        Set<String> examPartIds = questionMap.values().stream()
                .map(Question::getExamPartId).collect(Collectors.toSet());

        testParts.stream().map(TestPart::getExamPartId).filter(Objects::nonNull).forEach(examPartIds::add);
        Map<String, ExamPart> examPartMap = examPartRepository.findAllById(examPartIds).stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, e -> e));

        Map<String, List<AnswerAdminResponse>> answersByQuestionId =
                answerService.getAnswersForMultipleQuestionsForAdmin(questionIds);

        return new TestAdminDataBundle(
                testParts, questionsByPartId, questionMap,
                passageMap, examPartMap, answersByQuestionId, passageMediaByPassageId
        );
    }

    private Map<String, List<PassageMediaResponse>> loadPassageMediaByPassageId(Set<String> passageIds) {
        if (passageIds == null || passageIds.isEmpty()) return Collections.emptyMap();
        return passageMediaRepository.findByPassageIdInOrderByIdAsc(passageIds).stream()
                .map(passageMediaMapper::toResponse)
                .collect(Collectors.groupingBy(PassageMediaResponse::getPassageId));
    }

    private List<TestPartAdminResponse> buildAdminPartResponses(TestAdminDataBundle data, String orderAttemptId) {
        return data.testParts().stream().map(tp -> {
            List<TestQuestion> tqList = orderPartQuestions(
                    tp.getTestPartId(),
                    data.questionsByPartId().getOrDefault(tp.getTestPartId(), Collections.emptyList()),
                    data.questionMap(),
                    orderAttemptId);

            Map<String, List<Question>> groupedByPassage = tqList.stream()
                    .map(tq -> data.questionMap().get(tq.getQuestionId()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.groupingBy(
                            q -> q.getPassageId() == null ? "NO_PASSAGE" : q.getPassageId().toString(),
                            LinkedHashMap::new,
                            Collectors.toList()
                    ));

            List<QuestionGroupAdminResponse> groupResponses = groupedByPassage.entrySet().stream()
                    .map(entry -> buildQuestionGroupAdmin(entry.getKey(), entry.getValue(), data))
                    .toList();

            ExamPart examPart = data.examPartMap().get(tp.getExamPartId());
            String partName = examPart != null ? examPart.getName() : null;

            return testMapper.toTestPartAdminResponse(tp, partName, groupResponses);
        }).toList();
    }

    private QuestionGroupAdminResponse buildQuestionGroupAdmin(
            String passageId, List<Question> questionsInGroup, TestAdminDataBundle data) {

        PassageResponse passageResponse = null;
        if (!"NO_PASSAGE".equals(passageId)) {
            Passage p = data.passageMap().get(passageId.toString());
            if (p != null) {
                List<PassageMediaResponse> medias = data.passageMediaByPassageId()
                        .getOrDefault(p.getPassageId(), Collections.emptyList());
                passageResponse = passageMapper.toResponse(p, medias);
            }
        }

        List<QuestionAdminResponse> questionResponses = questionsInGroup.stream()
                .map(q -> buildQuestionAdminResponse(q, data))
                .toList();

        return testMapper.toQuestionGroupAdmin(passageResponse, questionResponses);
    }

    private QuestionAdminResponse buildQuestionAdminResponse(Question q, TestAdminDataBundle data) {
        List<AnswerAdminResponse> answers = data.answersByQuestionId()
                .getOrDefault(q.getQuestionId(), Collections.emptyList());

        String examTypeId = Optional.ofNullable(data.examPartMap().get(q.getExamPartId()))
                .map(ExamPart::getExamTypeId).orElse(null);

        return testMapper.toQuestionAdminResponse(q, examTypeId, answers);
    }

    private TestAdminResponse buildAdminTestResponse(
            Test test, long totalAttempts, List<TestPartAdminResponse> partResponses) {

        return testMapper.toAdminFullResponse(
                test, totalAttempts, test.calculateStatus().name(), partResponses);
    }

    private TestAdminResponse buildEmptyAdminResponse(Test test, long totalAttempts) {
        return testMapper.toAdminEmptyResponse(
                test, totalAttempts, test.calculateStatus().name(), Collections.emptyList());
    }

    private record TestUserDataBundle(
            List<TestPart> testParts,
            Map<String, List<TestQuestion>> questionsByPartId,
            Map<String, Question> questionMap,
            Map<String, Passage> passageMap,
            Map<String, List<AnswerResponse>> answersByQuestionId,
            Map<String, List<PassageMediaResponse>> passageMediaByPassageId,
            Map<String, String> examPartNameById
    ) {}

    private record TestAdminDataBundle(
            List<TestPart> testParts,
            Map<String, List<TestQuestion>> questionsByPartId,
            Map<String, Question> questionMap,
            Map<String, Passage> passageMap,
            Map<String, ExamPart> examPartMap,
            Map<String, List<AnswerAdminResponse>> answersByQuestionId,
            Map<String, List<PassageMediaResponse>> passageMediaByPassageId
    ) {}
}
