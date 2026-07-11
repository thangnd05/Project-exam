package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.shared.util.ClassAccessGuard;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import com.project_exam.backend.modules.assessment.test.dto.AddQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.test.dto.AddRandomQuestionsToTestRequest;
import com.project_exam.backend.modules.assessment.test.repository.TestPartRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestQuestionRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.classroom.member.domain.ClassMember.MemberStatus;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AddRandomQuestionsResponse;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionCollectionRepository;
import com.project_exam.backend.modules.users.user.service.AdminUserProvider;
import com.project_exam.backend.modules.classroom.member.repository.ClassMemberRepository;
import com.project_exam.backend.modules.classroom.clazz.repository.ClassRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Tách khỏi TestService: các use-case GẮN CÂU HỎI vào part của đề
 * (thêm theo danh sách id, hoặc lấy ngẫu nhiên/tuần tự từ kho).
 */
@Service
@RequiredArgsConstructor
public class TestQuestionAssignmentService {

    private final TestRepository testRepository;
    private final TestPartRepository testPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final QuestionRepository questionRepository;
    private final AuthUtils authUtils;
    private final AdminUserProvider adminUserProvider;
    private final ClassMemberRepository classMemberRepository;
    private final ClassRepository classRepository;
    private final ClassAccessGuard classAccessGuard;
    private final QuestionCollectionRepository questionCollectionRepository;

    private Set<String> collectionWithChildrenIds(String collectionId) {
        Set<String> ids = new HashSet<>();
        ids.add(collectionId);
        questionCollectionRepository.findByParentId(collectionId)
                .forEach(c -> ids.add(c.getCollectionId()));
        return ids;
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
        //  Pre-compute: admin-bank set & accessible classes của user (cache để tránh query mỗi câu).
        Set<String> adminIds = adminUserProvider.adminUserIds();
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
            //  Validate: user phải có quyền đọc câu hỏi này (own / admin bank / lớp mình thuộc / là admin).
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
        //  Verify ownership: chỉ người tạo đề (hoặc admin) mới được bơm câu hỏi vào part.
        Test parentTest = testRepository.findById(testPart.getTestId())
                .orElseThrow(() -> new NotFoundException("Đề không tồn tại: " + testPart.getTestId()));
        boolean isOwner = currentUserId != null && currentUserId.equals(parentTest.getCreatedBy());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.TEST_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền sửa đề này.");
        }
        //  Nếu lấy nguồn từ class bank, user phải là teacher (hoặc thành viên) của lớp đó và chapter phải thuộc lớp.
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
            Set<String> adminIds = adminUserProvider.adminUserIds();
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
            Set<String> collectionScope = collectionWithChildrenIds(request.getCollectionId());
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
