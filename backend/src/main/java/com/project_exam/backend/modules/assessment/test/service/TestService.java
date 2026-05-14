package com.project_exam.backend.modules.assessment.test.service;

// --- Shared ---
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.shared.util.ClassAccessGuard;

// --- Assessment: Test (module này) ---
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import com.project_exam.backend.modules.assessment.test.domain.TestStatus;
import com.project_exam.backend.modules.assessment.test.dto.AddQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.AddRandomQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.CreateTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.QuestionGroupResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.repository.TestPartRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestQuestionRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.classroom.domain.ClassMember.MemberStatus;

// --- Assessment: Exam ---
import com.project_exam.backend.modules.assessment.exam.domain.ExamCategory;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AddRandomQuestionsResponse;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionGroupAdminResponse;
import com.project_exam.backend.modules.assessment.exam.repository.ExamCategoryRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.PassageRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.service.AnswerService;

// --- Assessment: Attempt ---
import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserAnswerRepository;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.attempt.service.UserTestService;

// --- Users ---
import com.project_exam.backend.modules.users.domain.Role;
import com.project_exam.backend.modules.users.domain.User;
import com.project_exam.backend.modules.users.repository.RoleRepository;
import com.project_exam.backend.modules.users.repository.UserRepository;

// --- Classroom ---
import com.project_exam.backend.modules.classroom.repository.ClassMemberRepository;
import com.project_exam.backend.modules.classroom.repository.ClassRepository;

// --- Jakarta & Spring ---
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

// --- Java ---
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class TestService {
    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final AnswerService answerService;
    private final RoleRepository  roleRepository;
    private final UserRepository userRepository;
    private final ExamPartRepository  examPartRepository;
    private final ExamCategoryRepository examCategoryRepository;
    private final PassageRepository  passageRepository;
    private final UserTestRepository userTestRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final AuthUtils authUtils;
    private final UserTestService userTestService;
    private final ClassRepository classRepository;
    private final ClassMemberRepository classMemberRepository;
    private final ClassAccessGuard classAccessGuard;

    public List<TestResponse> getAllTests() {
        return testRepository.findAll().stream()
                .map(test -> buildUserTestSummary(test, null))
                .toList();
    }

    /**
     * Trả về các đề thi do ADMIN tạo theo examTypeId, dùng cho danh sách chung
     * mà mọi user đều thấy (không lộ đề cá nhân của user khác).
     */
    public List<TestResponse> getAdminTestsByExamType(String examTypeId) {
        Role adminRole = roleRepository.findByRoleName("ADMIN");
        if (adminRole == null) return new ArrayList<>();
        Set<String> adminIds = userRepository.findByRoleId(adminRole.getRoleId()).stream()
                .map(User::getUserId)
                .collect(Collectors.toSet());
        if (adminIds.isEmpty()) return new ArrayList<>();

        return testRepository.findAll().stream()
                .filter(t -> examTypeId.equals(t.getExamTypeId()))
                .filter(t -> t.getClassId() == null)
                .filter(t -> adminIds.contains(t.getCreatedBy()))
                .map(test -> buildUserTestSummary(test, null))
                .toList();
    }

    public Optional<Test> getTestById(String id) {
        return testRepository.findById(id);
    }

    public Test save(Test test) {
        return testRepository.save(test);
    }

    @Transactional
    public void deleteTest(String id, HttpServletRequest httpRequest) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại: " + id));
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isOwner = currentUserId != null && currentUserId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Bạn không có quyền xóa đề này.");
        }
        cascadeDeleteTestInternal(id);
    }

    /**
     * Cascade xoá 1 đề: lượt làm (user_tests + user_answers), liên kết câu (test_questions),
     * test_parts, rồi tới chính test. KHÔNG xoá questions trong kho — chúng độc lập.
     * Không kiểm tra quyền — caller phải đảm bảo.
     */
    @Transactional
    public void cascadeDeleteTestInternal(String testId) {
        // 1. Lượt làm + đáp án người dùng
        List<UserTest> userTests = userTestRepository.findByTestId(testId);
        for (UserTest ut : userTests) {
            List<UserAnswer> uas = userAnswerRepository.findByUserTestId(ut.getUserTestId());
            if (!uas.isEmpty()) userAnswerRepository.deleteAll(uas);
        }
        if (!userTests.isEmpty()) userTestRepository.deleteAll(userTests);

        // 2. test_questions thuộc các test_part của đề
        List<TestPart> parts = testPartRepository.findByTestId(testId);
        for (TestPart p : parts) {
            testQuestionRepository.deleteByTestPartId(p.getTestPartId());
        }
        // 3. test_parts
        if (!parts.isEmpty()) testPartRepository.deleteAll(parts);

        // 4. test
        testRepository.deleteById(testId);
    }

    /**
     * Cập nhật test từ CreateTestRequest (dùng chung DTO với tạo mới).
     * Chỉ ghi đè các field được gửi lên (khác null); không đổi createdBy, createdAt.
     */
    public Test updateTest(String id, CreateTestRequest request, HttpServletRequest httpRequest) {

        Test test = testRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại: " + id));
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isOwner = currentUserId != null && currentUserId.equals(test.getCreatedBy());
        if (!isOwner && !authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Bạn không có quyền sửa đề này.");
        }
        // 🔒 Nếu đổi classId/chapterId, áp dụng cùng guard như khi tạo mới.
        String effectiveClassId = request.getClassId() != null ? request.getClassId() : test.getClassId();
        String effectiveChapterId = request.getChapterId() != null ? request.getChapterId() : test.getChapterId();
        if (request.getClassId() != null) {
            classAccessGuard.requireTeacher(effectiveClassId, currentUserId, httpRequest);
        }
        if (request.getChapterId() != null) {
            classAccessGuard.requireChapterInClass(effectiveChapterId, effectiveClassId);
        }

        if (request.getTitle() != null) test.setTitle(request.getTitle());
        if (request.getDescription() != null) test.setDescription(request.getDescription());
        if (request.getExamTypeId() != null) test.setExamTypeId(request.getExamTypeId());
        if (request.getDurationMinutes() != null) test.setDurationMinutes(request.getDurationMinutes());
        if (request.getBannerUrl() != null) test.setBannerUrl(request.getBannerUrl());
        if (request.getMaxAttempts() != null) test.setMaxAttempts(request.getMaxAttempts());
        if (request.getClassId() != null) test.setClassId(request.getClassId());
        if (request.getChapterId() != null) test.setChapterId(request.getChapterId());
        if (request.getExamCategoryId() != null) test.setExamCategoryId(request.getExamCategoryId());
        if (request.getAvailableFrom() != null) test.setAvailableFrom(request.getAvailableFrom());
        if (request.getAvailableTo() != null) test.setAvailableTo(request.getAvailableTo());
        return testRepository.save(test);
    }

    public TestResponse buildUserTestSummary(Test test, String userId) {

        long attemptsUsed = 0;
        if (userId != null) {
            attemptsUsed = userTestRepository.countByTestIdAndUserId(
                    test.getTestId(),
                    userId
            );
        }
        long totalAttempts = userTestRepository.countByTestId(test.getTestId());

        Integer maxAttempts = test.getMaxAttempts();
        Integer remainingAttempts = null;
        boolean canDoTest = true;

        if (maxAttempts != null) {
            remainingAttempts = (int) Math.max(0, maxAttempts - attemptsUsed);
            canDoTest = userId == null || remainingAttempts > 0;
        }

        return TestResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(test.calculateStatus().name())
                .maxAttempts(maxAttempts)                // giữ nguyên null
                .attemptsUsed((int) attemptsUsed)
                .remainingAttempts(remainingAttempts)   // null nếu không giới hạn
                .totalAttempts(totalAttempts)
                .canDoTest(canDoTest)                   // luôn true nếu null
                .parts(null)
                .build();
    }

    public List<TestAdminResponse> getAllTestsByAdmin() {
        Role adminRole = roleRepository.findByRoleName("ADMIN");
        if (adminRole == null) return new ArrayList<>();

        List<User> adminUsers = userRepository.findByRoleId(adminRole.getRoleId());
        if (adminUsers.isEmpty()) return new ArrayList<>();

        List<Test> result = new ArrayList<>();
        for (User admin : adminUsers) {
            result.addAll(testRepository.findByCreatedBy(admin.getUserId()));
        }
        return result.stream()
                .map(this::buildAdminTestSummary)
                .toList();
    }

    private TestAdminResponse buildAdminTestSummary(Test test) {
        long totalAttempts = userTestRepository.countByTestId(test.getTestId());

        return TestAdminResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(test.calculateStatus().name())
                .maxAttempts(test.getMaxAttempts())
                .totalAttempts(totalAttempts)
                .classId(test.getClassId())
                .parts(null)
                .build();
    }

    public List<TestAdminResponse> getTestsByUser(String userId) {
        if (userId == null) {
            return List.of();
        }
        return testRepository.findByCreatedBy(userId).stream()
                .map(this::buildAdminTestSummary)
                .toList();
    }

    public List<TestResponse> getTestsByUser(HttpServletRequest httpRequest) {
        String currentUserId = authUtils.getUserId(httpRequest);
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng.");
        }
        return testRepository.findByCreatedBy(currentUserId).stream()
                .map(test -> buildUserTestSummary(test, currentUserId))
                .toList();
    }

    @Transactional
    public TestResponse getTestFullById(String testId, HttpServletRequest httpRequest) {
        // 1. Lấy thông tin người dùng (guest -> null, không lỗi).
        String currentUserId;
        try {
            currentUserId = authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            currentUserId = null;
        }

        Test test = testRepository.findById(testId).orElseThrow(() -> new NotFoundException("Test not found"));

        // 2. Guest: chỉ cho xem nếu test thuộc ExamCategory có guestAllowed=true và không gắn lớp.
        boolean isGuest = (currentUserId == null);
        if (isGuest) {
            boolean guestEligible = test.getClassId() == null
                    && test.getExamCategoryId() != null
                    && examCategoryRepository.findById(test.getExamCategoryId())
                            .map(ExamCategory::getGuestAllowed)
                            .orElse(false);
            if (!guestEligible) {
                return TestResponse.builder()
                        .testId(test.getTestId()).title(test.getTitle())
                        .status(TestStatus.LOGIN_REQUIRED.name()).canDoTest(false)
                        .build();
            }
        }

        UserTest latest = isGuest
                ? null
                : userTestRepository.findTopByUserIdAndTestIdOrderByStartedAtDesc(currentUserId, testId).orElse(null);

        // 3. Logic Auto-Submit — chỉ áp dụng cho user đã đăng nhập.
        if (!isGuest) {
            handleAutoSubmit(test, latest);
        }

        // 4. Kiểm tra số lượt làm bài — guest không bị giới hạn theo user.
        int attemptsUsed = isGuest
                ? 0
                : userTestRepository.countByUserIdAndTestIdAndStatus(currentUserId, testId, UserTest.Status.COMPLETED);
        Integer maxAttempts = test.getMaxAttempts();
        Integer remaining = (!isGuest && maxAttempts != null) ? Math.max(0, maxAttempts - attemptsUsed) : null;
        long totalAttempts = userTestRepository.countByTestId(testId);

        if (!isGuest && maxAttempts != null && remaining <= 0) {
            return buildLimitExceededResponse(test, attemptsUsed, remaining, totalAttempts);
        }

        // 5. Load data
        TestUserDataBundle data = loadUserTestData(testId);
        if (data.testParts().isEmpty()) {
            return buildEmptyUserTestResponse(test, maxAttempts, attemptsUsed, remaining);
        }

        // 6. Shuffle seed
        long seed = (latest != null ? latest.getUserTestId() : testId).hashCode();

        // 7. Build responses
        List<TestPartResponse> partResponses = buildUserPartResponses(data, seed);

        return buildUserTestResponse(test, maxAttempts, attemptsUsed, remaining, totalAttempts, partResponses);
    }

    // ================= USER VERSION REFACTORING =================

    private record TestUserDataBundle(
            List<TestPart> testParts,
            Map<String, List<TestQuestion>> questionsByPartId,
            Map<String, Question> questionMap,
            Map<String, Passage> passageMap,
            Map<String, List<AnswerResponse>> answersByQuestionId
    ) {}

    private TestUserDataBundle loadUserTestData(String testId) {
        List<TestPart> testParts = testPartRepository.findByTestId(testId);
        if (testParts.isEmpty()) {
            return new TestUserDataBundle(
                    Collections.emptyList(),
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

        Map<String, List<AnswerResponse>> answersByQuestionId =
                answerService.getAnswersForMultipleQuestions(questionIds);

        return new TestUserDataBundle(
                testParts, questionsByPartId, questionMap, passageMap, answersByQuestionId
        );
    }

    private List<TestPartResponse> buildUserPartResponses(TestUserDataBundle data, long seed) {
        return data.testParts().stream().map(tp -> {
            List<TestQuestion> tqList = data.questionsByPartId()
                    .getOrDefault(tp.getTestPartId(), Collections.emptyList());

            Map<String, QuestionGroupResponse> groupsMap = new LinkedHashMap<>();

            for (TestQuestion tq : tqList) {
                Question q = data.questionMap().get(tq.getQuestionId());
                if (q == null) continue;

                QuestionResponse qDto = QuestionResponse.builder()
                        .questionId(q.getQuestionId())
                        .examPartId(q.getExamPartId())
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType())
                        .isBank(q.getIsBank())
                        .testPartId(tp.getTestPartId())
                        .answers(data.answersByQuestionId().getOrDefault(q.getQuestionId(), Collections.emptyList()))
                        .build();

                if (q.getPassageId() != null) {
                    String groupKey = "P_" + q.getPassageId();
                    if (!groupsMap.containsKey(groupKey)) {
                        Passage p = data.passageMap().get(q.getPassageId());
                        PassageResponse pDto = (p != null)
                                ? new PassageResponse(p.getPassageId(), p.getContent(), p.getMediaUrl(), p.getPassageType())
                                : null;
                        groupsMap.put(groupKey, new QuestionGroupResponse(pDto, new ArrayList<>()));
                    }
                    groupsMap.get(groupKey).getQuestions().add(qDto);
                } else {
                    groupsMap.put("Q_" + q.getQuestionId(), new QuestionGroupResponse(null, new ArrayList<>(List.of(qDto))));
                }
            }

            List<QuestionGroupResponse> finalGroups = new ArrayList<>(groupsMap.values());
            return new TestPartResponse(tp.getTestPartId(), tp.getExamPartId(), finalGroups);
        }).toList();
    }

    private TestResponse buildUserTestResponse(
            Test test, Integer maxAttempts, int attemptsUsed, Integer remaining,
            long totalAttempts, List<TestPartResponse> partResponses) {

        return TestResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .classId(test.getClassId())
                .chapterId(test.getChapterId())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(test.calculateStatus().name())
                .maxAttempts(maxAttempts)
                .attemptsUsed(attemptsUsed)
                .remainingAttempts(remaining)
                .totalAttempts(totalAttempts)
                .canDoTest(true)
                .parts(partResponses)
                .build();
    }

    // ================= END USER REFACTORING =================

    private TestResponse buildEmptyUserTestResponse(Test test, Integer maxAttempts, int attemptsUsed, Integer remaining) {
        long totalAttempts = userTestRepository.countByTestId(test.getTestId());
        return TestResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(test.calculateStatus().name())
                .maxAttempts(maxAttempts)
                .attemptsUsed(attemptsUsed)
                .remainingAttempts(remaining)
                .totalAttempts(totalAttempts)
                .canDoTest(true)
                .parts(Collections.emptyList())
                .build();
    }

    // Hàm bổ trợ để xử lý Auto-submit (Tách ra cho gọn code)
private void handleAutoSubmit(Test test, UserTest latest) {
    Integer duration = test.getDurationMinutes();
    if (latest != null && latest.getStatus() == UserTest.Status.IN_PROGRESS && duration != null && duration > 0) {
        LocalDateTime endTime = latest.getStartedAt().plusMinutes(duration);
        if (test.getAvailableTo() != null && test.getAvailableTo().isBefore(endTime)) endTime = test.getAvailableTo();
        
        if (!LocalDateTime.now().isBefore(endTime)) {
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

// Hàm bổ trợ build Response khi hết lượt làm (Tách ra cho gọn)
private TestResponse buildLimitExceededResponse(Test test, int used, Integer rem, long total) {
    return TestResponse.builder()
            .testId(test.getTestId()).title(test.getTitle()).description(test.getDescription())
            .examCategoryId(test.getExamCategoryId())
            .classId(test.getClassId()).chapterId(test.getChapterId())
            .status("FORBIDDEN").maxAttempts(test.getMaxAttempts())
            .attemptsUsed(used).remainingAttempts(rem).totalAttempts(total)
            .canDoTest(false).build();
}

// ================= ADMIN VERSION REFACTORING =================

    public TestAdminResponse getTestFullByIdAdmin(String testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));
        long totalAttempts = userTestRepository.countByTestId(testId);

        TestAdminDataBundle data = loadAdminTestData(test.getTestId());

        if (data.testParts().isEmpty()) {
            return buildEmptyAdminResponse(test, totalAttempts);
        }

        List<TestPartAdminResponse> partResponses = buildAdminPartResponses(data);

        return buildAdminTestResponse(test, totalAttempts, data, partResponses);
    }

    private record TestAdminDataBundle(
            List<TestPart> testParts,
            Map<String, List<TestQuestion>> questionsByPartId,
            Map<String, Question> questionMap,
            Map<String, Passage> passageMap,
            Map<String, ExamPart> examPartMap,
            Map<String, List<AnswerAdminResponse>> answersByQuestionId
    ) {}

    private TestAdminDataBundle loadAdminTestData(String testId) {
        List<TestPart> testParts = testPartRepository.findByTestId(testId);
        if (testParts.isEmpty()) {
            return new TestAdminDataBundle(
                    Collections.emptyList(),
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

        Set<String> examPartIds = questionMap.values().stream()
                .map(Question::getExamPartId).collect(Collectors.toSet());
        Map<String, ExamPart> examPartMap = examPartRepository.findAllById(examPartIds).stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, e -> e));

        Map<String, List<AnswerAdminResponse>> answersByQuestionId =
                answerService.getAnswersForMultipleQuestionsForAdmin(questionIds);

        return new TestAdminDataBundle(
                testParts, questionsByPartId, questionMap,
                passageMap, examPartMap, answersByQuestionId
        );
    }

    private List<TestPartAdminResponse> buildAdminPartResponses(TestAdminDataBundle data) {
        return data.testParts().stream().map(tp -> {
            List<TestQuestion> tqList = data.questionsByPartId()
                    .getOrDefault(tp.getTestPartId(), Collections.emptyList());

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

            return new TestPartAdminResponse(tp.getTestPartId(), tp.getExamPartId(), groupResponses);
        }).toList();
    }

    private QuestionGroupAdminResponse buildQuestionGroupAdmin(
            String passageId, List<Question> questionsInGroup, TestAdminDataBundle data) {

        PassageResponse passageResponse = null;
        if (!"NO_PASSAGE".equals(passageId)) {
            Passage p = data.passageMap().get(passageId.toString());
            if (p != null) {
                passageResponse = new PassageResponse(
                        p.getPassageId(), p.getContent(), p.getMediaUrl(), p.getPassageType()
                );
            }
        }

        List<QuestionAdminResponse> questionResponses = questionsInGroup.stream()
                .map(q -> buildQuestionAdminResponse(q, data))
                .toList();

        return new QuestionGroupAdminResponse(passageResponse, questionResponses);
    }

    private QuestionAdminResponse buildQuestionAdminResponse(Question q, TestAdminDataBundle data) {
        List<AnswerAdminResponse> answers = data.answersByQuestionId()
                .getOrDefault(q.getQuestionId(), Collections.emptyList());

        String examTypeId = Optional.ofNullable(data.examPartMap().get(q.getExamPartId()))
                .map(ExamPart::getExamTypeId).orElse(null);

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

    private TestAdminResponse buildAdminTestResponse(
            Test test, long totalAttempts, TestAdminDataBundle data,
            List<TestPartAdminResponse> partResponses) {

        return TestAdminResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(test.calculateStatus().name())
                .maxAttempts(test.getMaxAttempts())
                .totalAttempts(totalAttempts)
                .classId(test.getClassId())
                .parts(partResponses)
                .build();
    }

    private TestAdminResponse buildEmptyAdminResponse(Test test, long totalAttempts) {
        return TestAdminResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .examTypeId(test.getExamTypeId())
                .examCategoryId(test.getExamCategoryId())
                .createdBy(test.getCreatedBy())
                .createdAt(test.getCreatedAt())
                .bannerUrl(test.getBannerUrl())
                .durationMinutes(test.getDurationMinutes())
                .availableFrom(test.getAvailableFrom())
                .availableTo(test.getAvailableTo())
                .status(test.calculateStatus().name())
                .maxAttempts(test.getMaxAttempts())
                .totalAttempts(totalAttempts)
                .classId(test.getClassId())
                .parts(Collections.emptyList())
                .build();
    }

    // ================= END ADMIN REFACTORING =================

    
    public Map<String, Object> canStartTest(String userId, Test test) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> result = new HashMap<>();

        if (test.getAvailableFrom() != null && test.getAvailableFrom().isAfter(now)) {
            result.put("canStart", false);
            result.put("message", "Bài kiểm tra chưa bắt đầu");
            return result;
        }

        if (test.getAvailableTo() != null && test.getAvailableTo().isBefore(now)) {
            result.put("canStart", false);
            result.put("message", "Bài kiểm tra đã kết thúc");
            return result;
        }

        int attemptsUsed = userTestRepository.countByUserIdAndTestIdAndStatus(
                userId,
                test.getTestId(),
                UserTest.Status.COMPLETED
        );        Integer maxAttempts = test.getMaxAttempts();

        if (maxAttempts != null && attemptsUsed >= maxAttempts) {
            result.put("canStart", false);
            result.put("message", "Bạn đã hết số lượt làm bài");
            return result;
        }

        result.put("canStart", true);
        result.put("message", "OK");
        return result;
    }

    public List<TestResponse> getTestByClassId(String classId, HttpServletRequest request) {
        // 🧩 Lấy user hiện tại từ token
        String currentUserId = authUtils.getUserId(request);
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "🔒 Bạn cần đăng nhập để xem bài kiểm tra.");
        }

        // 🧩 Kiểm tra quyền truy cập lớp
        boolean isMember = classMemberRepository.existsByClassIdAndUserIdAndStatus(
                classId, currentUserId, MemberStatus.APPROVED);
        boolean isTeacher = classRepository.existsByClassIdAndTeacherId(classId, currentUserId);

        if (!isMember && !isTeacher) {
            throw new ForbiddenException("Bạn không có quyền xem bài kiểm tra của lớp này!");
        }

        // ✅ Nếu hợp lệ, trả danh sách bài kiểm tra
        return testRepository.findByClassId(classId).stream()
                .map(test -> buildUserTestSummary(test, currentUserId))
                .toList();
    }

    public List<TestResponse> getTestByClassIdAndChapterId(String classId,String chapterId, HttpServletRequest request) {
        // 🧩 Lấy user hiện tại từ token
        String currentUserId = authUtils.getUserId(request);
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "🔒 Bạn cần đăng nhập để xem bài kiểm tra.");
        }

        // 🧩 Kiểm tra quyền truy cập lớp
        boolean isMember = classMemberRepository.existsByClassIdAndUserIdAndStatus(
                classId, currentUserId, MemberStatus.APPROVED);
        boolean isTeacher = classRepository.existsByClassIdAndTeacherId(classId, currentUserId);

        if (!isMember && !isTeacher) {
            throw new ForbiddenException("Bạn không có quyền xem bài kiểm tra của lớp này!");
        }

        // ✅ Nếu hợp lệ, trả danh sách bài kiểm tra
        return testRepository.findByClassIdAndChapterId(classId,chapterId).stream()
                .map(test -> buildUserTestSummary(test, currentUserId))
                .toList();
    }

    public List<TestResponse> getTestByCreateBy(HttpServletRequest request) {
        // 🧩 Lấy user hiện tại từ token
        String currentUserId = authUtils.getUserId(request);
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "🔒 Bạn cần đăng nhập để xem bài kiểm tra.");
        }

        // ✅ Nếu hợp lệ, trả danh sách bài kiểm tra
        return testRepository.findByCreatedBy(currentUserId).stream()
                .map(test -> buildUserTestSummary(test, currentUserId))
                .toList();
    }

    public List<TestResponse> getMyPersonalTests(HttpServletRequest request) {

        String currentUserId = authUtils.getUserId(request);
        if (currentUserId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "🔒 Bạn cần đăng nhập để xem bài kiểm tra."
            );
        }

        List<Test> tests =
                testRepository.findByCreatedByAndClassIdIsNullAndChapterIdIsNull(currentUserId);

        return tests.stream()
                .map(test -> buildUserTestSummary(test, currentUserId))
                .toList();
    }

    /**
     * Gắn câu hỏi từ kho vào part của đề (chỉ tạo bản ghi test_questions).
     * Câu hỏi phải đã tồn tại trong kho; không tạo câu hỏi mới ở đây.
     */
    @Transactional
    public void addQuestionsToTestPart(AddQuestionsToTestRequest request, HttpServletRequest httpRequest) {
        if (request.getTestPartId() == null || request.getQuestionIds() == null || request.getQuestionIds().isEmpty()) {
            throw new BadRequestException("testPartId và questionIds không được rỗng.");
        }
        String testPartId = request.getTestPartId();
        TestPart testPart = testPartRepository.findById(testPartId)
                .orElseThrow(() -> new NotFoundException("TestPart không tồn tại: " + testPartId));
        Test parentTest = testRepository.findById(testPart.getTestId())
                .orElseThrow(() -> new NotFoundException("Đề không tồn tại: " + testPart.getTestId()));
        String currentUserId = authUtils.getUserId(httpRequest);
        boolean isOwner = currentUserId != null && currentUserId.equals(parentTest.getCreatedBy());
        boolean isAdmin = authUtils.isAdmin(httpRequest);
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Bạn không có quyền sửa đề này.");
        }
        // 🔒 Pre-compute: admin-bank set & accessible classes của user (cache để tránh query mỗi câu).
        Set<String> adminIds = getAdminUserIdSet();
        Set<String> accessibleClassIds = new HashSet<>();
        if (currentUserId != null) {
            classMemberRepository.findByUserIdAndStatus(currentUserId,MemberStatus.APPROVED)
                    .forEach(m -> accessibleClassIds.add(m.getClassId()));
            classRepository.findByTeacherId(currentUserId)
                    .forEach(c -> accessibleClassIds.add(c.getClassId()));
        }
        int nextDisplayOrder = testQuestionRepository.findMaxDisplayOrderByTestPartId(testPartId) + 1;

        for (String questionId : request.getQuestionIds()) {
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new NotFoundException("Câu hỏi không tồn tại trong kho: " + questionId));
            if (!question.getExamPartId().equals(testPart.getExamPartId())) {
                throw new BadRequestException("Câu hỏi " + questionId + " không thuộc examPart của part này.");
            }
            // 🔒 Validate: user phải có quyền đọc câu hỏi này (own / admin bank / lớp mình thuộc / là admin).
            if (!isAdmin) {
                boolean ownQuestion = currentUserId != null && currentUserId.equals(question.getCreatedBy());
                boolean inAdminBank = question.getClassId() == null && adminIds.contains(question.getCreatedBy());
                boolean inAccessibleClass = question.getClassId() != null && accessibleClassIds.contains(question.getClassId());
                if (!ownQuestion && !inAdminBank && !inAccessibleClass) {
                    throw new ForbiddenException("Bạn không có quyền sử dụng câu hỏi: " + questionId);
                }
            }
            if (testQuestionRepository.existsByQuestionIdAndTestPartId(questionId, testPartId)) {
                continue;
            }
            TestQuestion tq = new TestQuestion();
            tq.setTestPartId(testPartId);
            tq.setQuestionId(questionId);
            tq.setDisplayOrder(nextDisplayOrder++);
            testQuestionRepository.save(tq);
        }
    }

    /**
     * Lấy câu hỏi random từ kho và gắn vào part.
     * Cá nhân (không classId/chapterId): chỉ kho của user đăng nhập (created_by = currentUserId).
     * Lớp: classId (+ chapterId nếu có).
     */
    @Transactional
    private Set<String> getAdminUserIdSet() {
        Role adminRole = roleRepository.findByRoleName("ADMIN");
        if (adminRole == null) {
            return Collections.emptySet();
        }
        return userRepository.findByRoleId(adminRole.getRoleId()).stream()
                .map(User::getUserId)
                .collect(Collectors.toSet());
    }

    public AddRandomQuestionsResponse addRandomQuestionsToTestPart(AddRandomQuestionsToTestRequest request, String currentUserId, HttpServletRequest httpRequest) {
        if (request.getTestPartId() == null || request.getCount() == null || request.getCount() <= 0) {
            throw new BadRequestException("testPartId và count (số câu) phải hợp lệ.");
        }
        boolean useAdminBank = "admin".equalsIgnoreCase(request.getBank());
        if (!useAdminBank && request.getClassId() == null && currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng hiện tại.");
        }
        if (request.getChapterId() != null && request.getClassId() == null) {
            throw new BadRequestException("Khi có chapterId thì phải có classId.");
        }
        String testPartId = request.getTestPartId();
        int count = request.getCount();
        TestPart testPart = testPartRepository.findById(testPartId)
                .orElseThrow(() -> new NotFoundException("TestPart không tồn tại: " + testPartId));
        // 🔒 Verify ownership: chỉ người tạo đề (hoặc admin) mới được bơm câu hỏi vào part.
        Test parentTest = testRepository.findById(testPart.getTestId())
                .orElseThrow(() -> new NotFoundException("Đề không tồn tại: " + testPart.getTestId()));
        boolean isOwner = currentUserId != null && currentUserId.equals(parentTest.getCreatedBy());
        if (!isOwner && !authUtils.isAdmin(httpRequest)) {
            throw new ForbiddenException("Bạn không có quyền sửa đề này.");
        }
        // 🔒 Nếu lấy nguồn từ class bank, user phải là teacher (hoặc thành viên) của lớp đó và chapter phải thuộc lớp.
        if (request.getClassId() != null) {
            classAccessGuard.requireMemberOrTeacher(request.getClassId(), currentUserId, httpRequest);
            classAccessGuard.requireChapterInClass(request.getChapterId(), request.getClassId());
        }
        String examPartId = testPart.getExamPartId();

        List<TestQuestion> existingLinks = testQuestionRepository.findByTestPartIdOrderByDisplayOrder(testPartId);
        Set<String> existingIds = existingLinks.stream()
                .map(TestQuestion::getQuestionId)
                .collect(Collectors.toSet());
        int nextDisplayOrder = existingLinks.stream()
                .map(TestQuestion::getDisplayOrder)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        List<Question> pool;
        if (Boolean.TRUE.equals(request.getIsSequential())) {
            int fromIdx = (request.getFromIndex() != null && request.getFromIndex() > 0) ? request.getFromIndex() : 1;
            int toIdx = (request.getToIndex() != null && request.getToIndex() >= fromIdx) ? request.getToIndex() : fromIdx;
            int seqLimit = toIdx - fromIdx + 1;
            int seqOffset = fromIdx - 1;

            List<Question> allQuestions;
            if (useAdminBank) {
                Set<String> adminIds = getAdminUserIdSet();
                allQuestions = adminIds.isEmpty()
                        ? new ArrayList<>()
                        : questionRepository.findAdminBankByExamPart(examPartId, adminIds);
            } else if (request.getClassId() != null && request.getChapterId() != null) {
                allQuestions = questionRepository.findByExamPartIdAndClassIdAndChapterId(
                        examPartId, request.getClassId(), request.getChapterId());
            } else if (request.getClassId() != null) {
                allQuestions = questionRepository.findByExamPartIdAndClassId(
                        examPartId, request.getClassId());
            } else {
                allQuestions = questionRepository.findByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(
                        examPartId, currentUserId);
            }

            int actualOffset = Math.min(seqOffset, allQuestions.size());
            int actualLimit = Math.min(seqLimit, allQuestions.size() - actualOffset);
            pool = allQuestions.subList(actualOffset, actualOffset + actualLimit);
        } else {
            if (useAdminBank) {
                Set<String> adminIds = getAdminUserIdSet();
                List<Question> adminQuestions = adminIds.isEmpty()
                        ? new ArrayList<>()
                        : new ArrayList<>(questionRepository.findAdminBankByExamPart(examPartId, adminIds));
                Collections.shuffle(adminQuestions);
                pool = adminQuestions.size() > count ? adminQuestions.subList(0, count) : adminQuestions;
            } else if (request.getClassId() != null && request.getChapterId() != null) {
                pool = questionRepository.findRandomQuestionsByExamPartIdAndClassIdAndChapterId(
                        examPartId, request.getClassId(), request.getChapterId(), Pageable.ofSize(count));
            } else if (request.getClassId() != null) {
                pool = questionRepository.findRandomQuestionsByExamPartIdAndClassId(
                        examPartId, request.getClassId(), Pageable.ofSize(count));
            } else {
                pool = questionRepository.findRandomByExamPartAndCreatedByAndClassIdIsNullAndChapterIdIsNull(
                        examPartId, currentUserId, count);
            }
        }

        List<String> toAdd = pool.stream()
                .map(Question::getQuestionId)
                .filter(id -> !existingIds.contains(id))
                .limit(count)
                .toList();

        for (String questionId : toAdd) {
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new NotFoundException("Câu hỏi không tồn tại: " + questionId));
            if (!question.getExamPartId().equals(examPartId)) {
                continue;
            }
            TestQuestion tq = new TestQuestion();
            tq.setTestPartId(testPartId);
            tq.setQuestionId(questionId);
            tq.setDisplayOrder(nextDisplayOrder++);
            testQuestionRepository.save(tq);
        }
        return new AddRandomQuestionsResponse(toAdd.size());
    }

}