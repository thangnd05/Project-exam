package com.project_exam.backend.modules.assessment.test.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

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
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuickChallengeCardResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartSummaryResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestCollectionResponse;
import com.project_exam.backend.modules.assessment.test.domain.UserTestAccess;
import com.project_exam.backend.modules.assessment.test.repository.TestPartRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestQuestionRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.assessment.test.repository.UserTestAccessRepository;
import com.project_exam.backend.modules.gamification.coin.service.CoinService;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.modules.classroom.domain.ClassMember.MemberStatus;

// --- Assessment: Exam ---
import com.project_exam.backend.modules.assessment.exam.domain.ExamCategory;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.domain.Skill;
import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AddRandomQuestionsResponse;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionGroupAdminResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.PassageMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamCategoryRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.assessment.exam.repository.SkillRepository;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

// --- Java ---
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
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
    private final ExamTypeRepository examTypeRepository;
    private final SkillRepository skillRepository;
    private final PassageRepository  passageRepository;
    private final UserTestRepository userTestRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final AuthUtils authUtils;
    private final UserTestService userTestService;
    private final ClassRepository classRepository;
    private final ClassMemberRepository classMemberRepository;
    private final ClassAccessGuard classAccessGuard;
    private final UserTestAccessRepository userTestAccessRepository;
    private final CoinService coinService;
    private final PassageMapper passageMapper;
    private final com.project_exam.backend.modules.assessment.exam.repository.PassageMediaRepository passageMediaRepository;
    private final com.project_exam.backend.modules.assessment.exam.mapper.PassageMediaMapper passageMediaMapper;
    private final com.project_exam.backend.modules.assessment.test.mapper.TestMapper testMapper;
    private final com.project_exam.backend.modules.assessment.exam.repository.QuestionCollectionRepository questionCollectionRepository;

    /** User có quyền làm bài chưa: miễn phí, hoặc là người tạo, hoặc đã mua. */
    private boolean hasTestAccess(Test test, String userId) {
        if (test.getCostCoins() == null || test.getCostCoins() <= 0) return true;
        if (userId == null) return false;
        if (userId.equals(test.getCreatedBy())) return true;
        return userTestAccessRepository.existsByUserIdAndTestId(userId, test.getTestId());
    }

    public List<TestResponse> getAllTests() {
        List<Test> tests = testRepository.findAll();
        return buildUserTestSummariesBatch(tests, null);
    }

    /**
     * Danh sách bài Quick Challenge cho Hero landing page (guest xem được).
     * Trả về test + các part (tên + số câu), bỏ qua bài đã hết hạn (ENDED).
     * Cố tình không kèm % / điểm — chỉ preview cấu trúc bài để user chọn làm.
     */
    public List<QuickChallengeCardResponse> getQuickChallengeTests() {
        String categoryId = examCategoryRepository.findByCode("QUICK_CHALLENGE")
                .map(ExamCategory::getExamCategoryId)
                .orElse(null);
        if (categoryId == null) {
            return List.of(); // chưa seed category -> hero tự fallback ảnh
        }
        List<Test> tests = testRepository.findByExamCategoryId(categoryId).stream()
                .filter(t -> t.calculateStatus() != TestStatus.ENDED)
                .toList();

        // Batch map examTypeId -> name để dựng tab phân loại (tránh N+1)
        Set<String> examTypeIds = tests.stream()
                .map(Test::getExamTypeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, String> examTypeNames = examTypeRepository.findAllById(examTypeIds).stream()
                .collect(Collectors.toMap(ExamType::getExamTypeId, ExamType::getName));

        return tests.stream()
                .map(t -> buildQuickChallengeCard(t, examTypeNames.get(t.getExamTypeId())))
                .toList();
    }

    private QuickChallengeCardResponse buildQuickChallengeCard(Test test, String examTypeName) {
        List<TestPart> testParts = testPartRepository.findByTestId(test.getTestId());

        // Batch load ExamPart (tránh N+1)
        Set<String> examPartIds = testParts.stream()
                .map(TestPart::getExamPartId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, ExamPart> examPartMap = examPartRepository.findAllById(examPartIds).stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, ep -> ep));

        // Gom theo SKILL nếu part có kỹ năng (gọn hơn, vd 7 part TOEIC -> 2 skill Listening/Reading).
        // Part không gắn skill thì giữ riêng theo part. agg: key -> [tổng số câu, displayOrder nhỏ nhất]
        Map<String, int[]> agg = new LinkedHashMap<>();
        Map<String, String> skillKeyIds = new HashMap<>(); // key (skill) -> skillId để resolve tên
        Map<String, String> partNames = new HashMap<>();   // key (part) -> tên part

        for (TestPart tp : testParts) {
            ExamPart ep = examPartMap.get(tp.getExamPartId());
            int numQuestions = tp.getNumQuestions() != null ? tp.getNumQuestions() : 0;
            int order = (ep != null && ep.getDisplayOrder() != null) ? ep.getDisplayOrder() : 999;
            String skillId = ep != null ? ep.getSkillId() : null;

            String key;
            if (skillId != null) {
                key = "skill:" + skillId;
                skillKeyIds.put(key, skillId);
            } else {
                key = "part:" + tp.getExamPartId();
                partNames.put(key, (ep != null && ep.getName() != null) ? ep.getName() : "Phần thi");
            }

            int[] cur = agg.get(key);
            if (cur == null) {
                agg.put(key, new int[]{numQuestions, order});
            } else {
                cur[0] += numQuestions;
                cur[1] = Math.min(cur[1], order);
            }
        }

        // Resolve tên skill
        Map<String, String> skillNames = skillRepository.findAllById(new HashSet<>(skillKeyIds.values())).stream()
                .collect(Collectors.toMap(Skill::getSkillId, Skill::getName));

        List<QuickChallengeCardResponse.PartSummary> parts = agg.entrySet().stream()
                .map(e -> {
                    String key = e.getKey();
                    String name = skillKeyIds.containsKey(key)
                            ? skillNames.getOrDefault(skillKeyIds.get(key), "Kỹ năng")
                            : partNames.getOrDefault(key, "Phần thi");
                    return testMapper.toPartSummary(name, e.getValue()[0], e.getValue()[1]);
                })
                .sorted(Comparator.comparingInt(QuickChallengeCardResponse.PartSummary::getDisplayOrder))
                .toList();

        int totalQuestions = parts.stream()
                .mapToInt(QuickChallengeCardResponse.PartSummary::getNumQuestions)
                .sum();

        return testMapper.toQuickChallengeCard(
                test, examTypeName, test.calculateStatus().name(), totalQuestions, parts);
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

        List<Test> filtered = testRepository.findAll().stream()
                .filter(t -> examTypeId.equals(t.getExamTypeId()))
                .filter(t -> t.getClassId() == null)
                .filter(t -> adminIds.contains(t.getCreatedBy()))
                .toList();
        return buildUserTestSummariesBatch(filtered, null);
    }

    /**
     * Bản phân trang của getAdminTestsByExamType — dùng cho danh sách test theo examType.
     * Why: trang user có thể có rất nhiều đề admin tạo, không nên load all rồi filter in-memory.
     */
    public PageResponse<TestResponse> getAdminTestsByExamTypePaged(String examTypeId, int page, int size, String userId) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 12 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Set<String> adminIds = resolveAdminIds();
        if (adminIds.isEmpty()) return PageResponse.empty(safePage, safeSize);

        Page<Test> testPage = testRepository
                .findByExamTypeIdAndClassIdIsNullAndCreatedByIn(examTypeId, adminIds, pageable);

        // Truyền userId để biết bài nào đã mở khoá (owner/đã mua) -> badge hiển thị đúng.
        return toTestPageResponse(testPage, userId);
    }

    /** Tập userId của tất cả admin (đề công khai = do admin tạo). Rỗng nếu chưa có admin. */
    private Set<String> resolveAdminIds() {
        Role adminRole = roleRepository.findByRoleName("ADMIN");
        if (adminRole == null) return Set.of();
        return userRepository.findByRoleId(adminRole.getRoleId()).stream()
                .map(User::getUserId)
                .collect(Collectors.toSet());
    }

    /** collectionId của bộ đề + tất cả collection con (2 cấp). */
    private List<String> collectionWithChildrenIds(String collectionId) {
        List<String> ids = new ArrayList<>();
        ids.add(collectionId);
        questionCollectionRepository.findByParentId(collectionId)
                .forEach(c -> ids.add(c.getCollectionId()));
        return ids;
    }

    /**
     * Danh sách folder bộ đề (collection cha) của một loại kỳ thi, kèm số đề bên trong (gộp con).
     */
    public List<TestCollectionResponse> getTestCollectionsByExamType(String examTypeId) {
        Set<String> adminIds = resolveAdminIds();
        return questionCollectionRepository.findByExamTypeIdAndParentIdIsNull(examTypeId).stream()
                .map(folder -> {
                    long testCount = adminIds.isEmpty() ? 0L
                            : testRepository.countByClassIdIsNullAndCreatedByInAndCollectionIdIn(
                                    adminIds, collectionWithChildrenIds(folder.getCollectionId()));
                    return TestCollectionResponse.builder()
                            .collectionId(folder.getCollectionId())
                            .name(folder.getName())
                            .description(folder.getDescription())
                            .testCount(testCount)
                            .build();
                })
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    /**
     * Đề (công khai) thuộc một bộ đề: nếu collection là cha thì gộp luôn đề của các con.
     */
    public PageResponse<TestResponse> getTestsByCollectionPaged(
            String collectionId, int page, int size, String userId) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 12 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Set<String> adminIds = resolveAdminIds();
        if (adminIds.isEmpty()) return PageResponse.empty(safePage, safeSize);

        Page<Test> testPage = testRepository.findByClassIdIsNullAndCreatedByInAndCollectionIdIn(
                adminIds, collectionWithChildrenIds(collectionId), pageable);
        return toTestPageResponse(testPage, userId);
    }

    private PageResponse<TestResponse> toTestPageResponse(Page<Test> testPage, String userId) {
        return PageResponse.from(testPage, buildUserTestSummariesBatch(testPage.getContent(), userId));
    }

    /**
     * Build list TestResponse hiệu năng cao — group count attempts thay vì query per-test.
     * Trước: N+1 với 200 test = 400+ count query. Sau: 2 query bất kể số test.
     */
    private List<TestResponse> buildUserTestSummariesBatch(List<Test> tests, String userId) {
        if (tests.isEmpty()) return List.of();
        List<String> testIds = tests.stream().map(Test::getTestId).toList();

        Map<String, Long> totalAttemptsByTest = userTestRepository.countGroupedByTestIdIn(testIds)
                .stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));

        Map<String, Long> attemptsUsedByTest = userId != null
                ? userTestRepository.countGroupedByTestIdInAndUserId(testIds, userId).stream()
                        .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]))
                : Map.of();

        // Quyền đã mua: 1 query, gom thành set để tránh N+1 khi build từng item.
        Set<String> ownedTestIds = userId != null
                ? userTestAccessRepository.findByUserId(userId).stream()
                        .map(UserTestAccess::getTestId)
                        .collect(Collectors.toSet())
                : Set.of();

        return tests.stream()
                .map(test -> buildUserTestSummaryFromCounts(
                        test, userId,
                        attemptsUsedByTest.getOrDefault(test.getTestId(), 0L),
                        totalAttemptsByTest.getOrDefault(test.getTestId(), 0L),
                        ownedTestIds))
                .toList();
    }

    private TestResponse buildUserTestSummaryFromCounts(
            Test test, String userId, long attemptsUsed, long totalAttempts, Set<String> ownedTestIds) {
        Integer maxAttempts = test.getMaxAttempts();
        Integer remainingAttempts = null;
        boolean canDoTest = true;

        if (maxAttempts != null) {
            remainingAttempts = (int) Math.max(0, maxAttempts - attemptsUsed);
            canDoTest = userId == null || remainingAttempts > 0;
        }

        boolean paid = test.getCostCoins() != null && test.getCostCoins() > 0;
        boolean owned = !paid
                || (userId != null
                        && (userId.equals(test.getCreatedBy()) || ownedTestIds.contains(test.getTestId())));

        return testMapper.toSummaryResponse(
                test, maxAttempts, (int) attemptsUsed, remainingAttempts, totalAttempts,
                canDoTest, owned, paid && !owned, test.calculateStatus().name());
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
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
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
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
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
        // collectionId: gửi chuỗi rỗng để gỡ bộ đề, có giá trị để gán/đổi.
        if (request.getCollectionId() != null) {
            test.setCollectionId(request.getCollectionId().isBlank() ? null : request.getCollectionId());
        }
        if (request.getAvailableFrom() != null) test.setAvailableFrom(request.getAvailableFrom());
        if (request.getAvailableTo() != null) test.setAvailableTo(request.getAvailableTo());
        // Giá xu: chỉ admin đặt được, và chỉ cho bài công khai (không gắn lớp). Đặt 0 để gỡ phí.
        if (request.getCostCoins() != null) {
            boolean publicTest = effectiveClassId == null;
            test.setCostCoins(authUtils.hasPermission(PermissionCatalog.TEST_MANAGE_PRICING) && publicTest ? request.getCostCoins() : null);
        }
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

        boolean owned = hasTestAccess(test, userId);
        boolean paid = test.getCostCoins() != null && test.getCostCoins() > 0;

        return testMapper.toSummaryResponse(
                test, maxAttempts, (int) attemptsUsed, remainingAttempts, totalAttempts,
                canDoTest, owned, paid && !owned, test.calculateStatus().name());
    }

    public List<TestAdminResponse> getAllTestsByAdmin() {
        Role adminRole = roleRepository.findByRoleName("ADMIN");
        if (adminRole == null) return new ArrayList<>();

        List<User> adminUsers = userRepository.findByRoleId(adminRole.getRoleId());
        if (adminUsers.isEmpty()) return new ArrayList<>();

        List<String> adminIds = adminUsers.stream().map(User::getUserId).toList();
        List<Test> result = testRepository.findByCreatedByIn(adminIds);
        return buildAdminTestSummariesBatch(result);
    }

    /**
     * Build list TestAdminResponse — group count thay N queries countByTestId.
     */
    private List<TestAdminResponse> buildAdminTestSummariesBatch(List<Test> tests) {
        if (tests.isEmpty()) return List.of();
        List<String> testIds = tests.stream().map(Test::getTestId).toList();
        Map<String, Long> totalAttemptsByTest = userTestRepository.countGroupedByTestIdIn(testIds)
                .stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));

        return tests.stream()
                .map(t -> buildAdminTestSummaryFromCount(
                        t, totalAttemptsByTest.getOrDefault(t.getTestId(), 0L)))
                .toList();
    }

    private TestAdminResponse buildAdminTestSummaryFromCount(Test test, long totalAttempts) {
        return testMapper.toAdminSummaryResponse(test, totalAttempts, test.calculateStatus().name());
    }

    public List<TestAdminResponse> getTestsByUser(String userId) {
        if (userId == null) {
            return List.of();
        }
        return buildAdminTestSummariesBatch(testRepository.findByCreatedBy(userId));
    }

    public List<TestResponse> getTestsByUser(HttpServletRequest httpRequest) {
        String currentUserId = authUtils.getUserId(httpRequest);
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng.");
        }
        return buildUserTestSummariesBatch(testRepository.findByCreatedBy(currentUserId), currentUserId);
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
                return testMapper.toLoginRequiredResponse(
                        test, TestStatus.LOGIN_REQUIRED.name(), false);
            }
        }

        // 2b. Bài trả phí chưa mở khoá: KHÔNG trả đề (parts) để tránh lộ câu hỏi.
        boolean paid = test.getCostCoins() != null && test.getCostCoins() > 0;
        if (paid && !hasTestAccess(test, currentUserId)) {
            return testMapper.toPaymentRequiredResponse(
                    test, "PAYMENT_REQUIRED", false, false, true);
        }

        UserTest latest = isGuest
                ? null
                : userTestRepository.findTopByUserIdAndTestIdOrderByStartedAtDesc(currentUserId, testId).orElse(null);

        // 3. Logic Auto-Submit — chỉ áp dụng cho user đã đăng nhập.
        if (!isGuest) {
            handleAutoSubmit(test, latest);
        }

        // 4. Kiểm tra số lượt làm bài — guest không bị giới hạn theo user.
        // Lượt luyện tập theo Part KHÔNG tính vào maxAttempts -> loại mode PRACTICE.
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
            Map<String, List<AnswerResponse>> answersByQuestionId,
            Map<String, List<PassageMediaResponse>> passageMediaByPassageId,
            Map<String, String> examPartNameById
    ) {}

    private TestUserDataBundle loadUserTestData(String testId) {
        List<TestPart> testParts = testPartRepository.findByTestId(testId);
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

    /** Map examPartId -> tên part (ExamPart.name) cho danh sách testParts. */
    private Map<String, String> loadExamPartNames(List<TestPart> testParts) {
        Set<String> examPartIds = testParts.stream()
                .map(TestPart::getExamPartId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (examPartIds.isEmpty()) return Collections.emptyMap();
        return examPartRepository.findAllById(examPartIds).stream()
                .filter(e -> e.getName() != null)
                .collect(Collectors.toMap(ExamPart::getExamPartId, ExamPart::getName));
    }

    /**
     * Tóm tắt các Part của đề (tên, số câu, skill) cho modal "Chọn chế độ".
     * Nhẹ: chỉ đếm số câu theo testPart, không load nội dung câu hỏi.
     */
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

    private List<TestPartResponse> buildUserPartResponses(TestUserDataBundle data, long seed) {
        return data.testParts().stream().map(tp -> {
            List<TestQuestion> tqList = data.questionsByPartId()
                    .getOrDefault(tp.getTestPartId(), Collections.emptyList());

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
                        // Bài thi: KHÔNG trả bản dịch (includeTranslation = false).
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

    // ================= END USER REFACTORING =================

    private TestResponse buildEmptyUserTestResponse(Test test, Integer maxAttempts, int attemptsUsed, Integer remaining) {
        long totalAttempts = userTestRepository.countByTestId(test.getTestId());
        return testMapper.toEmptyResponse(
                test, maxAttempts, attemptsUsed, remaining, totalAttempts,
                true, true, false, test.calculateStatus().name(), Collections.emptyList());
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
    return testMapper.toLimitExceededResponse(
            test, used, rem, total, "FORBIDDEN", false, true, false);
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
            Map<String, List<AnswerAdminResponse>> answersByQuestionId,
            Map<String, List<PassageMediaResponse>> passageMediaByPassageId
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
        // Gồm cả examPartId của các TestPart để lấy đúng tên part kể cả khi part rỗng câu hỏi.
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

    /** Batch-load audio/ảnh của các passage, gom theo passageId (rỗng nếu không có). */
    private Map<String, List<PassageMediaResponse>> loadPassageMediaByPassageId(Set<String> passageIds) {
        if (passageIds == null || passageIds.isEmpty()) return Collections.emptyMap();
        return passageMediaRepository.findByPassageIdInOrderByIdAsc(passageIds).stream()
                .map(passageMediaMapper::toResponse)
                .collect(Collectors.groupingBy(PassageMediaResponse::getPassageId));
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
            Test test, long totalAttempts, TestAdminDataBundle data,
            List<TestPartAdminResponse> partResponses) {

        return testMapper.toAdminFullResponse(
                test, totalAttempts, test.calculateStatus().name(), partResponses);
    }

    private TestAdminResponse buildEmptyAdminResponse(Test test, long totalAttempts) {
        return testMapper.toAdminEmptyResponse(
                test, totalAttempts, test.calculateStatus().name(), Collections.emptyList());
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

        // Bài trả phí: lộ giá + trạng thái sở hữu để FE hiển thị nút "Mở khoá".
        boolean paid = test.getCostCoins() != null && test.getCostCoins() > 0;
        boolean owned = hasTestAccess(test, userId);
        result.put("costCoins", test.getCostCoins());
        result.put("owned", owned);
        result.put("requiresPayment", paid && !owned);
        if (paid && !owned) {
            result.put("canStart", false);
            result.put("message", "Bài này cần mở khoá bằng xu trước khi làm.");
            return result;
        }

        result.put("canStart", true);
        result.put("message", "OK");
        return result;
    }

    /** Mua quyền làm bài trả phí (trừ xu 1 lần, mở khoá vĩnh viễn). */
    @Transactional
    public TestResponse purchaseTestAccess(String userId, String testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test không tồn tại: " + testId));
        Integer cost = test.getCostCoins();
        if (cost == null || cost <= 0) {
            throw new BadRequestException("Bài này miễn phí, không cần mua.");
        }
        if (test.getClassId() != null) {
            throw new BadRequestException("Bài của lớp không bán bằng xu.");
        }
        if (userTestAccessRepository.existsByUserIdAndTestId(userId, testId)) {
            throw new ConflictException("Bạn đã mở khoá bài này.");
        }

        coinService.spend(userId, cost); // ném lỗi nếu không đủ xu

        UserTestAccess access = new UserTestAccess();
        access.setUserId(userId);
        access.setTestId(testId);
        access.setPurchasedAt(LocalDateTime.now());
        userTestAccessRepository.save(access);

        return buildUserTestSummary(test, userId);
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

        //  Nếu hợp lệ, trả danh sách bài kiểm tra
        return buildUserTestSummariesBatch(testRepository.findByClassId(classId), currentUserId);
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

        //  Nếu hợp lệ, trả danh sách bài kiểm tra
        return buildUserTestSummariesBatch(
                testRepository.findByClassIdAndChapterId(classId, chapterId), currentUserId);
    }

    public List<TestResponse> getTestByCreateBy(HttpServletRequest request) {
        // 🧩 Lấy user hiện tại từ token
        String currentUserId = authUtils.getUserId(request);
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "🔒 Bạn cần đăng nhập để xem bài kiểm tra.");
        }

        //  Nếu hợp lệ, trả danh sách bài kiểm tra
        return buildUserTestSummariesBatch(testRepository.findByCreatedBy(currentUserId), currentUserId);
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

        return buildUserTestSummariesBatch(tests, currentUserId);
    }

    /**
     * Bản phân trang của getMyPersonalTests — dùng cho trang "Bài kiểm tra của tôi".
     */
    public PageResponse<TestResponse> getMyPersonalTestsPaged(HttpServletRequest request, int page, int size) {
        String currentUserId = authUtils.getUserId(request);
        if (currentUserId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "🔒 Bạn cần đăng nhập để xem bài kiểm tra."
            );
        }

        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 12 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Test> testPage = testRepository
                .findByCreatedByAndClassIdIsNullAndChapterIdIsNull(currentUserId, pageable);

        return toTestPageResponse(testPage, currentUserId);
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
        boolean isAdmin = authUtils.hasPermission(PermissionCatalog.TEST_MANAGE);
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
                // Kho quản trị chỉ dùng được nếu có quyền QUESTION:MANAGE (đồng bộ với việc ẩn kho admin).
                boolean inAdminBank = question.getClassId() == null
                        && adminIds.contains(question.getCreatedBy())
                        && authUtils.hasPermission(PermissionCatalog.QUESTION_MANAGE);
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
        // Lấy câu hỏi ngẫu nhiên từ kho quản trị cần quyền QUESTION:MANAGE (đồng bộ với việc ẩn kho admin).
        if (useAdminBank) {
            authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        }
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
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
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

        // Lấy TOÀN BỘ ứng viên cho part (KHÔNG limit ở DB) để có thể gom theo passage.
        List<Question> candidates;
        if (useAdminBank) {
            Set<String> adminIds = getAdminUserIdSet();
            candidates = adminIds.isEmpty()
                    ? new ArrayList<>()
                    : new ArrayList<>(questionRepository.findAdminBankByExamPart(examPartId, adminIds));
        } else if (request.getClassId() != null && request.getChapterId() != null) {
            candidates = new ArrayList<>(questionRepository.findByExamPartIdAndClassIdAndChapterId(
                    examPartId, request.getClassId(), request.getChapterId()));
        } else if (request.getClassId() != null) {
            candidates = new ArrayList<>(questionRepository.findByExamPartIdAndClassId(
                    examPartId, request.getClassId()));
        } else {
            candidates = new ArrayList<>(questionRepository.findByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(
                    examPartId, currentUserId));
        }

        // Giới hạn theo Bộ đề (collection) nếu có. removeIf giữ nguyên thứ tự còn lại nên
        // chế độ "tuần tự" vẫn khớp index với danh sách (đã lọc bộ đề) mà FE hiển thị.
        if (request.getCollectionId() != null && !request.getCollectionId().isBlank()) {
            Set<String> collectionScope = collectionScopeIds(request.getCollectionId());
            candidates.removeIf(q -> q.getCollectionId() == null
                    || !collectionScope.contains(q.getCollectionId()));
        }

        boolean sequential = Boolean.TRUE.equals(request.getIsSequential());
        List<Question> pool;
        if (sequential) {
            int fromIdx = (request.getFromIndex() != null && request.getFromIndex() > 0) ? request.getFromIndex() : 1;
            int toIdx = (request.getToIndex() != null && request.getToIndex() >= fromIdx) ? request.getToIndex() : fromIdx;
            int seqLimit = toIdx - fromIdx + 1;
            int seqOffset = fromIdx - 1;
            int actualOffset = Math.min(seqOffset, candidates.size());
            int actualLimit = Math.min(seqLimit, candidates.size() - actualOffset);
            pool = candidates.subList(actualOffset, actualOffset + actualLimit);
        } else {
            // RANDOM: gom câu theo passage rồi chọn TRỌN cụm (Part 6/7 mỗi passage 4 câu) để
            // không bị lẻ; giữ thứ tự câu trong passage theo questionNumber.
            pool = pickRandomQuestionsKeepingPassages(candidates, existingIds, count);
        }

        // Sequential giữ hành vi cũ (cắt theo count); random KHÔNG cắt thêm để không vỡ cụm passage
        // (pool đã được giới hạn ~count ở mức nguyên cụm).
        Stream<String> idStream = pool.stream()
                .map(Question::getQuestionId)
                .filter(id -> !existingIds.contains(id));
        List<String> toAdd = sequential ? idStream.limit(count).toList() : idStream.toList();

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
        return AddRandomQuestionsResponse.builder()
                .addedCount(toAdd.size())
                .build();
    }

    /**
     * Chọn ngẫu nhiên câu hỏi nhưng GIỮ TRỌN cụm passage.
     *
     * <p>Câu cùng {@code passageId} được gom thành một nhóm và luôn thêm nguyên nhóm (Part 6/7
     * mỗi passage 4 câu) để passage không bị lẻ. Câu không thuộc passage coi như nhóm 1 phần tử.
     * Trong mỗi passage, sắp theo {@code questionNumber} để giữ đúng thứ tự câu. Trộn ngẫu nhiên
     * thứ tự các nhóm rồi thêm nguyên nhóm cho tới khi đạt {@code count} — có thể dôi ra ở nhóm
     * cuối, KHÔNG bao giờ cắt giữa nhóm.</p>
     */
    /**
     * Tập id bộ đề dùng để lọc câu: gồm chính bộ đề và các bộ đề con trực tiếp
     * (collection chỉ 2 cấp nên con trực tiếp là đủ).
     */
    private Set<String> collectionScopeIds(String collectionId) {
        Set<String> ids = new HashSet<>();
        ids.add(collectionId);
        questionCollectionRepository.findByParentId(collectionId)
                .forEach(c -> ids.add(c.getCollectionId()));
        return ids;
    }

    private List<Question> pickRandomQuestionsKeepingPassages(
            List<Question> candidates, Set<String> existingIds, int count) {
        LinkedHashMap<String, List<Question>> passageGroups = new LinkedHashMap<>();
        List<List<Question>> units = new ArrayList<>();
        for (Question q : candidates) {
            if (existingIds.contains(q.getQuestionId())) continue;
            if (q.getPassageId() != null && !q.getPassageId().isBlank()) {
                passageGroups.computeIfAbsent(q.getPassageId(), k -> new ArrayList<>()).add(q);
            } else {
                units.add(new ArrayList<>(List.of(q)));
            }
        }
        for (List<Question> group : passageGroups.values()) {
            group.sort(Comparator.comparingInt(
                    q -> q.getQuestionNumber() == null ? Integer.MAX_VALUE : q.getQuestionNumber()));
            units.add(group);
        }
        Collections.shuffle(units);

        List<Question> result = new ArrayList<>();
        for (List<Question> unit : units) {
            if (result.size() >= count) break;
            result.addAll(unit);
        }
        return result;
    }

}