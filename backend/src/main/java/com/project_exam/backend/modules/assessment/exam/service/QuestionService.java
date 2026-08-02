package com.project_exam.backend.modules.assessment.exam.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.infrastructure.cloudinary.CloudinaryService;
import com.project_exam.backend.modules.auth.dto.*;
import com.project_exam.backend.modules.users.user.dto.*;
import com.project_exam.backend.modules.users.rbac.dto.*;
import com.project_exam.backend.modules.posts.post.dto.*;
import com.project_exam.backend.modules.posts.comment.dto.*;
import com.project_exam.backend.modules.posts.category.dto.*;
import com.project_exam.backend.modules.posts.react.dto.*;
import com.project_exam.backend.modules.posts.saved.dto.*;
import com.project_exam.backend.modules.assessment.exam.dto.*;
import com.project_exam.backend.modules.assessment.test.dto.*;
import com.project_exam.backend.modules.assessment.attempt.dto.*;
import com.project_exam.backend.modules.vocabulary.album.dto.*;
import com.project_exam.backend.modules.vocabulary.word.dto.*;
import com.project_exam.backend.modules.vocabulary.learning.dto.*;
import com.project_exam.backend.modules.classroom.clazz.dto.*;
import com.project_exam.backend.modules.classroom.chapter.dto.*;
import com.project_exam.backend.modules.classroom.member.dto.*;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.PassageMapper;
import com.project_exam.backend.modules.assessment.exam.mapper.PassageMediaMapper;
import com.project_exam.backend.modules.assessment.exam.mapper.AnswerMapper;
import com.project_exam.backend.modules.assessment.exam.mapper.QuestionMapper;
import com.project_exam.backend.modules.users.user.domain.*;
import com.project_exam.backend.modules.users.rbac.domain.*;
import com.project_exam.backend.modules.posts.post.domain.*;
import com.project_exam.backend.modules.posts.comment.domain.*;
import com.project_exam.backend.modules.posts.category.domain.*;
import com.project_exam.backend.modules.posts.react.domain.*;
import com.project_exam.backend.modules.posts.saved.domain.*;
import com.project_exam.backend.modules.assessment.exam.domain.*;
import com.project_exam.backend.modules.assessment.test.domain.*;
import com.project_exam.backend.modules.assessment.attempt.domain.*;
import com.project_exam.backend.modules.vocabulary.album.domain.*;
import com.project_exam.backend.modules.vocabulary.word.domain.*;
import com.project_exam.backend.modules.vocabulary.learning.domain.*;
import com.project_exam.backend.modules.vocabulary.lookup.domain.*;
import com.project_exam.backend.modules.classroom.clazz.domain.*;
import com.project_exam.backend.modules.classroom.chapter.domain.*;
import com.project_exam.backend.modules.classroom.member.domain.*;
import com.project_exam.backend.modules.audit.domain.*;
import com.project_exam.backend.modules.users.user.repository.*;
import com.project_exam.backend.modules.users.rbac.repository.*;
import com.project_exam.backend.modules.users.user.service.AdminUserProvider;
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
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.shared.util.ClassAccessGuard;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final PassageRepository passageRepository;
    private final ExamPartRepository examPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestPartRepository testPartRepository;
    private final TestRepository testRepository;
    private final CloudinaryService cloudinaryService;
    private final AuthUtils authUtils;
    private final PassageMediaRepository passageMediaRepository;
    private final AnswerService answerService;
    private final ClassMemberRepository classMemberRepository;
    private final ClassRepository classRepository;
    private final QuestionDocumentImportService questionDocumentImportService;
    private final AdminUserProvider adminUserProvider;
    private final ClassAccessGuard classAccessGuard;
    private final UserAnswerRepository userAnswerRepository;
    private final TagService tagService;
    private final QuestionTagRepository questionTagRepository;
    private final PassageMapper passageMapper;
    private final PassageMediaMapper passageMediaMapper;
    private final AnswerMapper answerMapper;
    private final QuestionMapper questionMapper;

    private void requireClassWriteAccess(String classId, String chapterId, String currentUserId) {
        if (classId == null) {
            if (chapterId != null) {
                throw new BadRequestException("Khi có chapterId thì phải có classId.");
            }
            return;
        }
        classAccessGuard.requireMemberOrTeacher(classId, currentUserId);
        classAccessGuard.requireChapterInClass(chapterId, classId);
    }

    public List<Question> findAll() {
        return questionRepository.findAll();
    }

    public List<QuestionAdminResponse> findAllAdminSummaries() {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        return findAll().stream()
                .map(question -> questionMapper.toAdminResponseSummary(
                        question,
                        tagService.getTagsByQuestionId(question.getQuestionId())))
                .toList();
    }

    public Optional<Question> findById(String id) {
        return questionRepository.findById(id);
    }

    public Question save(Question question) {
        return questionRepository.save(question);
    }

    private List<Question> fetchQuestions(
            String examPartId,
            String classId,
            String chapterId,
            String currentUserId
    ) {

        if (classId == null) {
            return questionRepository
                    .findByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(
                            examPartId, currentUserId);
        }

        if (chapterId != null) {
            return questionRepository
                    .findByExamPartIdAndClassIdAndChapterId(
                            examPartId, classId, chapterId);
        }

        return questionRepository
                .findByExamPartIdAndClassId(
                        examPartId, classId);
    }

    private Map<String, Passage> loadPassagesById(List<Question> questions) {
        Set<String> passageIds = questions.stream()
                .map(Question::getPassageId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());

        if (passageIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return passageRepository.findAllById(passageIds).stream()
                .collect(java.util.stream.Collectors.toMap(Passage::getPassageId, p -> p));
    }

    private Map<String, List<PassageMediaResponse>> loadMediaByPassageId(Set<String> passageIds) {
        if (passageIds == null || passageIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<PassageMedia> allMedia = passageMediaRepository.findByPassageIdInOrderByIdAsc(passageIds);

        return allMedia.stream()
                .map(passageMediaMapper::toResponse)
                .collect(Collectors.groupingBy(PassageMediaResponse::getPassageId));
    }

    private QuestionResponse toUserQuestionResponse(
            Question question,
            Map<String, Passage> passagesById,
            Map<String, List<PassageMediaResponse>> mediaByPassageId,
            Map<String, List<AnswerResponse>> answersByQuestionId
    ) {
        PassageResponse passageResponse = null;
        if (question.getPassageId() != null) {
            Passage passage = passagesById.get(question.getPassageId());
            if (passage != null) {
                passageResponse = passageMapper.toResponse(passage);
            }
        }

        List<PassageMediaResponse> passageMedia = (question.getPassageId() == null)
                ? List.of()
                : mediaByPassageId.getOrDefault(question.getPassageId(), List.of());

        List<AnswerResponse> answers = new ArrayList<>(answersByQuestionId.getOrDefault(
                question.getQuestionId(),
                Collections.emptyList()
        ));

        return questionMapper.toUserResponse(question, passageResponse, passageMedia, answers);
    }

    private List<QuestionResponse> buildUserQuestionResponses(List<Question> questions) {
        if (questions == null || questions.isEmpty()) {
            return List.of();
        }

        List<String> questionIds = questions.stream()
                .map(Question::getQuestionId)
                .toList();
        Map<String, List<AnswerResponse>> answersByQuestionId =
                answerService.getAnswersForMultipleQuestions(questionIds);

        Map<String, Passage> passagesById = loadPassagesById(questions);
        Set<String> passageIds = passagesById.keySet();
        Map<String, List<PassageMediaResponse>> mediaByPassageId = loadMediaByPassageId(passageIds);

        return questions.stream()
                .map(q -> toUserQuestionResponse(q, passagesById, mediaByPassageId, answersByQuestionId))
                .toList();
    }

    public List<QuestionResponse> getQuestionsByPart(
            String examPartId,
            String classId,
            String chapterId,
            String currentUserId
    ) {

        if (classId != null) {
            classAccessGuard.requireMemberOrTeacher(classId, currentUserId);
            classAccessGuard.requireChapterInClass(chapterId, classId);
        } else if (chapterId != null) {
            throw new BadRequestException("Khi có chapterId thì phải có classId.");
        }

        List<Question> questions = fetchQuestions(
                examPartId,
                classId,
                chapterId,
                currentUserId
        );

        if (questions.isEmpty()) {
            return Collections.emptyList();
        }

        return buildUserQuestionResponses(questions);
    }

    public List<QuestionResponse> getAdminBankQuestionsByPart(String examPartId) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        Set<String> adminIds = adminUserProvider.adminUserIds();
        if (adminIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<Question> questions = questionRepository.findAdminBankByExamPart(examPartId, adminIds);
        if (questions.isEmpty()) {
            return Collections.emptyList();
        }
        return buildUserQuestionResponses(questions);
    }

    public long countAdminBankQuestionsByPart(String examPartId) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        Set<String> adminIds = adminUserProvider.adminUserIds();
        if (adminIds.isEmpty()) {
            return 0L;
        }
        return questionRepository.countAdminBankByExamPart(examPartId, adminIds);
    }

    private Set<String> getAccessibleClassIds(String currentUserId) {
        Set<String> classIds = new LinkedHashSet<>();
        classMemberRepository.findByUserIdAndStatus(currentUserId, ClassMember.MemberStatus.APPROVED)
                .forEach(member -> classIds.add(member.getClassId()));
        classRepository.findByTeacherId(currentUserId)
                .forEach(clazz -> classIds.add(clazz.getClassId()));
        return classIds;
    }

    private String resolveCurrentUserClassId(String currentUserId, String requestedClassId) {
        Set<String> classIds = getAccessibleClassIds(currentUserId);
        if (classIds.isEmpty()) {
            throw new BadRequestException("Bạn chưa thuộc lớp nào.");
        }

        if (requestedClassId != null) {
            if (!classIds.contains(requestedClassId)) {
                throw new ForbiddenException("Bạn không có quyền truy cập lớp: " + requestedClassId);
            }
            return requestedClassId;
        }

        if (classIds.size() > 1) {
            throw new BadRequestException("Tài khoản thuộc nhiều lớp. Vui lòng truyền classId.");
        }
        return classIds.iterator().next();
    }

    public List<QuestionResponse> getBankQuestionsByCurrentUserClass(
            String classId,
            String chapterId,
            String currentUserId
    ) {
        String resolvedClassId = resolveCurrentUserClassId(currentUserId, classId);

        List<Question> questions = (chapterId != null)
                ? questionRepository.findByClassIdAndChapterIdAndCreatedByAndIsBankTrue(resolvedClassId, chapterId, currentUserId)
                : questionRepository.findByClassIdAndCreatedByAndIsBankTrue(resolvedClassId, currentUserId);

        if (questions.isEmpty()) {
            return List.of();
        }

        return buildUserQuestionResponses(questions);
    }

    public long countBankQuestionsByCurrentUserClass(
            String classId,
            String chapterId,
            String currentUserId
    ) {
        String resolvedClassId = resolveCurrentUserClassId(currentUserId, classId);

        if (chapterId != null) {
            return questionRepository.countByClassIdAndChapterIdAndCreatedByAndIsBankTrue(resolvedClassId, chapterId, currentUserId);
        }
        return questionRepository.countByClassIdAndCreatedByAndIsBankTrue(resolvedClassId, currentUserId);
    }

    public List<NormalQuestionRequest> previewQuestionsFromDocument(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn file Word.");
        }
        return questionDocumentImportService.parseQuestionsFromDocument(file);
    }

    public List<PassageQuestionGroupRequest> previewPassageQuestionsFromDocument(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn file Word.");
        }
        return questionDocumentImportService.parsePassageQuestionsFromDocument(file);
    }

    @Transactional
    public List<QuestionAdminResponse> importQuestionsFromDocument(
            MultipartFile file,
            String examPartId,
            String classId,
            String chapterId,
            String currentUserId
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn file Word.");
        }
        if (examPartId == null) {
            throw new BadRequestException("Thiếu examPartId.");
        }

        List<NormalQuestionRequest> parsedQuestions = questionDocumentImportService.parseQuestionsFromDocument(file);
        BulkCreateQuestionsToBankRequest bulkRequest = new BulkCreateQuestionsToBankRequest(
                examPartId,
                classId,
                chapterId,
                parsedQuestions
        );

        return createBulkQuestionsToBankNoPassage(bulkRequest, currentUserId, Collections.emptyMap());
    }

    @Transactional
    public List<QuestionAdminResponse> createQuestionsFromDocumentAndAttachToTest(
            MultipartFile file,
            String testPartId,
            String classId,
            String chapterId,
            String currentUserId
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn file Word.");
        }
        if (testPartId == null) {
            throw new BadRequestException("Thiếu testPartId.");
        }

        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng.");
        }

        TestPart testPart = testPartRepository.findById(testPartId)
                .orElseThrow(() -> new NotFoundException("TestPart không tồn tại: " + testPartId));

        Test parentTest = testRepository.findById(testPart.getTestId())
                .orElseThrow(() -> new NotFoundException("Đề không tồn tại: " + testPart.getTestId()));
        if (!currentUserId.equals(parentTest.getCreatedBy()) && !authUtils.hasPermission(PermissionCatalog.QUESTION_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền sửa đề này.");
        }

        requireClassWriteAccess(classId, chapterId, currentUserId);

        List<NormalQuestionRequest> parsedQuestions = questionDocumentImportService.parseQuestionsFromDocument(file);
        if (parsedQuestions.isEmpty()) {
            return List.of();
        }

        int nextDisplayOrder = testQuestionRepository.findMaxDisplayOrderByTestPartId(testPartId) + 1;
        List<QuestionAdminResponse> responses = new ArrayList<>();
        for (NormalQuestionRequest parsedQuestion : parsedQuestions) {
            Question question = new Question();
            question.setExamPartId(testPart.getExamPartId());
            question.setPassageId(null);
            question.setQuestionText(parsedQuestion.getQuestionText());
            question.setQuestionType(parsedQuestion.getQuestionType());
            question.setExplanation(parsedQuestion.getExplanation());
            question.setCreatedBy(currentUserId);
            question.setIsBank(Boolean.FALSE);
            if (classId != null) {
                question.setClassId(classId);
            }
            if (chapterId != null) {
                question.setChapterId(chapterId);
            }
            if (parsedQuestion.getCollectionId() != null) {
                question.setCollectionId(parsedQuestion.getCollectionId());
            }
            question = questionRepository.save(question);

            List<Answer> savedAnswers = saveAnswersForQuestion(
                    question.getQuestionId(),
                    parsedQuestion.getAnswers(),
                    parsedQuestion.getQuestionType()
            );

            TestQuestion testQuestion = new TestQuestion();
            testQuestion.setTestPartId(testPartId);
            testQuestion.setQuestionId(question.getQuestionId());
            testQuestion.setDisplayOrder(nextDisplayOrder++);
            testQuestionRepository.save(testQuestion);

            attachImportTags(question.getQuestionId(), question.getExamPartId(), parsedQuestion.getTagIds(), parsedQuestion.getTagNames());

            responses.add(buildQuestionAdminResponse(question, null, savedAnswers));
        }

        return responses;
    }

    private void attachImportTags(String questionId, String examPartId,
                                  List<String> tagIds, List<String> tagNames) {
        List<String> ids = new ArrayList<>();
        if (tagIds != null) {
            ids.addAll(tagIds);
        }
        if (tagNames != null && !tagNames.isEmpty()) {
            ExamPart part = examPartRepository.findById(examPartId).orElse(null);
            if (part != null) {

                ids.addAll(tagService.resolveTagIdsByNames(
                        tagNames, part.getExamTypeId(), part.getName()));
            }
        }
        List<String> distinct = ids.stream()
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (!distinct.isEmpty()) {
            tagService.syncQuestionTags(questionId, distinct);
        }
    }

    @Transactional
    public void deleteById(String id, String currentUserId) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Câu hỏi không tồn tại."));
        boolean isOwner = currentUserId != null && currentUserId.equals(question.getCreatedBy());
        if (!isOwner && !authUtils.hasPermission(PermissionCatalog.QUESTION_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền xoá câu hỏi này.");
        }
        cascadeDeleteQuestionInternal(id);
    }

    @Transactional
    public void cascadeDeleteQuestionInternal(String questionId) {
        userAnswerRepository.deleteByQuestionId(questionId);
        testQuestionRepository.deleteByQuestionId(questionId);
        answerRepository.deleteByQuestionId(questionId);
        questionTagRepository.deleteByQuestionId(questionId);
        questionRepository.deleteById(questionId);
    }

    @Transactional
    public void cascadeDeleteQuestionsByChapter(String chapterId) {
        List<Question> questions = questionRepository.findByChapterId(chapterId);
        for (Question q : questions) {
            cascadeDeleteQuestionInternal(q.getQuestionId());
        }
    }

    @Transactional
    public void cascadeDeleteQuestionsByClass(String classId) {
        List<Question> questions = questionRepository.findByClassId(classId);
        for (Question q : questions) {
            cascadeDeleteQuestionInternal(q.getQuestionId());
        }
    }

    public long countByExamPartId(String examPartId, String classId, String chapterId, String currentUserId) {
        if (classId != null) {

            classAccessGuard.requireMemberOrTeacher(classId, currentUserId);
            classAccessGuard.requireChapterInClass(chapterId, classId);
            if (chapterId != null) {
                return questionRepository.countByExamPartIdAndClassIdAndChapterId(examPartId, classId, chapterId);
            }
            return questionRepository.countByExamPartIdAndClassId(examPartId, classId);
        }
        if (chapterId != null) {
            throw new BadRequestException("Khi có chapterId thì phải có classId.");
        }
        return questionRepository.countByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(examPartId, currentUserId);
    }

    @Transactional
    public List<QuestionAdminResponse> createBulkQuestionsToBank(BulkQuestionWithPassageRequest request,
                                                                String currentUserId,
                                                                Map<String, MultipartFile> files) throws IOException {
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng từ token.");
        }

        requireClassWriteAccess(request.getClassId(), request.getChapterId(), currentUserId);
        List<MultipartFile> uploadedFiles = files == null
                ? List.of()
                : files.entrySet().stream()
                .filter(e -> !"request".equals(e.getKey()))
                .map(Map.Entry::getValue)
                .filter(file -> file != null && !file.isEmpty())
                .toList();
        boolean hasUploadedFiles = !uploadedFiles.isEmpty();
        boolean hasMediaUrl = request.getPassage() != null
                && request.getPassage().getMediaUrl() != null
                && !request.getPassage().getMediaUrl().trim().isEmpty();
        if (request.getPassage() == null || (request.getPassage().getContent() == null || request.getPassage().getContent().trim().isEmpty())
                && !hasUploadedFiles
                && !hasMediaUrl) {
            throw new BadRequestException("Bulk tạo câu hỏi theo đoạn bắt buộc phải có passage (nội dung hoặc media).");
        }

        Passage passage = new Passage();
        passage.setContent(request.getPassage().getContent() != null ? request.getPassage().getContent() : "");
        passage.setContentTranslation(request.getPassage().getContentTranslation());
        passage.setPassageType(request.getPassage().getPassageType());
        if (hasMediaUrl) {
            passage.setMediaUrl(request.getPassage().getMediaUrl());
        } else {
            passage.setMediaUrl(null);
        }
        passage = passageRepository.save(passage);
        String passageId = passage.getPassageId();
        for (MultipartFile file : uploadedFiles) {
            savePassageMediaFile(passageId, file);
        }

        List<QuestionAdminResponse> responses = new ArrayList<>();
        int baseMax = resolveMaxQuestionNumber(
                request.getExamPartId(), request.getClassId(), request.getChapterId(), currentUserId);
        int batchIndex = 0;
        for (NormalQuestionRequest qReq : request.getQuestions()) {
            Question question = new Question();
            question.setExamPartId(request.getExamPartId());
            question.setPassageId(passageId);
            question.setQuestionText(qReq.getQuestionText());
            question.setQuestionType(qReq.getQuestionType());
            question.setExplanation(qReq.getExplanation());
            question.setCreatedBy(currentUserId);
            if (request.getClassId() != null) question.setClassId(request.getClassId());
            if (request.getChapterId() != null) question.setChapterId(request.getChapterId());
            if (qReq.getCollectionId() != null) question.setCollectionId(qReq.getCollectionId());
            question.setIsBank(Boolean.TRUE);
            question.setQuestionNumber(resolveBankQuestionNumber(baseMax, qReq, batchIndex++));
            question = questionRepository.save(question);

            List<Answer> savedAnswers = saveAnswersForQuestion(question.getQuestionId(), qReq.getAnswers(), qReq.getQuestionType());
            attachImportTags(question.getQuestionId(), question.getExamPartId(), qReq.getTagIds(), qReq.getTagNames());
            responses.add(buildQuestionAdminResponse(question, passage, savedAnswers));
        }
        return responses;
    }

    @Transactional
    public List<QuestionAdminResponse> createBulkQuestionsToBankNoPassage(
            BulkCreateQuestionsToBankRequest request,
            String currentUserId,
            Map<String, MultipartFile> files
    ) throws IOException {

        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng từ token.");
        }

        requireClassWriteAccess(request.getClassId(), request.getChapterId(), currentUserId);

        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            return List.of();
        }

        List<QuestionAdminResponse> responses = new ArrayList<>();
        int baseMax = resolveMaxQuestionNumber(
                request.getExamPartId(), request.getClassId(), request.getChapterId(), currentUserId);

        for (int i = 0; i < request.getQuestions().size(); i++) {

            final int questionIndex = i;
            NormalQuestionRequest qReq = request.getQuestions().get(i);

            Question question = new Question();
            question.setExamPartId(request.getExamPartId());
            question.setPassageId(null);
            question.setQuestionText(qReq.getQuestionText());
            question.setQuestionType(qReq.getQuestionType());
            question.setExplanation(qReq.getExplanation());
            question.setCreatedBy(currentUserId);
            question.setIsBank(Boolean.TRUE);

            if (request.getClassId() != null)
                question.setClassId(request.getClassId());

            if (request.getChapterId() != null)
                question.setChapterId(request.getChapterId());

            if (qReq.getCollectionId() != null)
                question.setCollectionId(qReq.getCollectionId());

            question.setQuestionNumber(resolveBankQuestionNumber(baseMax, qReq, i));
            question = questionRepository.save(question);

            List<MultipartFile> questionFiles = files.entrySet().stream()
                    .filter(e -> e.getKey().startsWith("media_" + questionIndex + "_"))
                    .map(Map.Entry::getValue)
                    .toList();

            if (!questionFiles.isEmpty()) {

                Passage passage = new Passage();
                passage.setContent("");

                Passage.PassageType determinedType = Passage.PassageType.READING;

                for (MultipartFile file : questionFiles) {
                    if (file != null && file.getContentType() != null) {
                        if (file.getContentType().startsWith("audio")) {
                            determinedType = Passage.PassageType.LISTENING;
                            break;
                        }
                    }
                }

                passage.setPassageType(determinedType);

                passage = passageRepository.save(passage);

                question.setPassageId(passage.getPassageId());
                questionRepository.save(question);

                for (MultipartFile file : questionFiles) {
                    if (file == null || file.isEmpty()) continue;

                    savePassageMediaFile(passage.getPassageId(), file);
                }
            }

            List<Answer> savedAnswers = saveAnswersForQuestion(
                    question.getQuestionId(),
                    qReq.getAnswers(),
                    qReq.getQuestionType()
            );

            attachImportTags(question.getQuestionId(), question.getExamPartId(), qReq.getTagIds(), qReq.getTagNames());

            responses.add(
                    buildQuestionAdminResponse(question, null, savedAnswers)
            );
        }

        return responses;
    }

    @Transactional
    public QuestionAdminResponse createQuestionAndAttachToTest(
            CreateQuestionAndAttachRequest request,
            String currentUserId,
            Map<String, MultipartFile> files
    ) throws IOException {

        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng.");
        }

        TestPart testPart = testPartRepository.findById(request.getTestPartId())
                .orElseThrow(() -> new NotFoundException("TestPart không tồn tại: " + request.getTestPartId()));

        Test parentTest = testRepository.findById(testPart.getTestId())
                .orElseThrow(() -> new NotFoundException("Đề không tồn tại: " + testPart.getTestId()));
        if (!currentUserId.equals(parentTest.getCreatedBy()) && !authUtils.hasPermission(PermissionCatalog.QUESTION_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền sửa đề này.");
        }

        requireClassWriteAccess(request.getClassId(), request.getChapterId(), currentUserId);

        String passageId = null;
        Passage savedPassage = null;

        boolean hasFiles = files != null && !files.isEmpty();
        boolean hasPassageReq = request.getPassage() != null;

        if (hasFiles || (hasPassageReq && hasPassageContent(request.getPassage()))) {
            Passage passage = new Passage();
            if (hasPassageReq) {
                passage.setContent(request.getPassage().getContent() != null ? request.getPassage().getContent() : "");
                passage.setContentTranslation(request.getPassage().getContentTranslation());
                passage.setPassageType(request.getPassage().getPassageType());
            } else {

                passage.setContent("");
                passage.setPassageType(Passage.PassageType.LISTENING);
            }

            savedPassage = passageRepository.save(passage);
            passageId = savedPassage.getPassageId();

            if (hasFiles) {
                for (MultipartFile file : files.values()) {
                    if (file == null || file.isEmpty()) continue;
                    savePassageMediaFile(passageId, file);
                }
            }
        }

        Question question = new Question();
        question.setExamPartId(testPart.getExamPartId());
        question.setPassageId(passageId);
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setExplanation(request.getExplanation());
        question.setCreatedBy(currentUserId);
        question.setIsBank(Boolean.FALSE);

        if (request.getClassId() != null) question.setClassId(request.getClassId());
        if (request.getChapterId() != null) question.setChapterId(request.getChapterId());
        if (request.getCollectionId() != null) question.setCollectionId(request.getCollectionId());

        question = questionRepository.save(question);

        List<Answer> savedAnswers = saveAnswersForQuestion(
                question.getQuestionId(),
                request.getAnswers(),
                request.getQuestionType()
        );

        TestQuestion tq = new TestQuestion();
        tq.setTestPartId(request.getTestPartId());
        tq.setQuestionId(question.getQuestionId());
        tq.setDisplayOrder(testQuestionRepository.findMaxDisplayOrderByTestPartId(request.getTestPartId()) + 1);
        testQuestionRepository.save(tq);

        attachImportTags(question.getQuestionId(), question.getExamPartId(),
                request.getTagIds(), request.getTagNames());

        return buildQuestionAdminResponse(question, savedPassage, savedAnswers);
    }

    private boolean hasPassageContent(PassageRequest pr) {
        return (pr.getContent() != null && !pr.getContent().trim().isEmpty())
                || pr.getMediaUrl() != null
                || (pr.getExtraContents() != null
                        && pr.getExtraContents().stream().anyMatch(s -> s != null && !s.trim().isEmpty()));
    }

    private void validateQuestionAnswers(Question.QuestionType questionType, List<AnswerRequest> answers) {

        if (questionType != Question.QuestionType.MCQ && questionType != Question.QuestionType.MSQ) {
            return;
        }
        boolean hasCorrect = answers != null && answers.stream().anyMatch(a -> Boolean.TRUE.equals(a.getIsCorrect()));
        if (!hasCorrect) {
            throw new BadRequestException("Mỗi câu hỏi trắc nghiệm phải có ít nhất 1 đáp án đúng.");
        }
    }

    private List<Answer> saveAnswersForQuestion(
            String questionId,
            List<AnswerRequest> answers,
            Question.QuestionType questionType
    ) {

        validateQuestionAnswers(questionType, answers);
        if (answers == null || answers.isEmpty()) return List.of();

        List<Answer> list = new ArrayList<>();

        switch (questionType) {
            case ESSAY -> {

                if (answers != null && !answers.isEmpty()) {
                    AnswerRequest ar = answers.get(0);
                    Answer a = new Answer();
                    a.setQuestionId(questionId);
                    a.setAnswerText(ar.getAnswerText() != null ? ar.getAnswerText() : "");
                    a.setAnswerLabel("SAMPLE_ANSWER");
                    a.setIsCorrect(true);
                    list.add(a);
                }
            }
            case MCQ, MSQ -> {

                for (AnswerRequest ar : answers) {
                    Answer a = new Answer();
                    a.setQuestionId(questionId);
                    a.setAnswerText(ar.getAnswerText() != null ? ar.getAnswerText() : "");
                    a.setAnswerLabel(ar.getAnswerLabel() != null ? ar.getAnswerLabel() : "");
                    a.setIsCorrect(Boolean.TRUE.equals(ar.getIsCorrect()));
                    list.add(a);
                }
            }
            default -> {

                for (AnswerRequest ar : answers) {
                    Answer a = new Answer();
                    a.setQuestionId(questionId);
                    a.setAnswerText(ar.getAnswerText() != null ? ar.getAnswerText() : "");
                    a.setAnswerLabel(ar.getAnswerLabel() != null ? ar.getAnswerLabel() : "");
                    a.setIsCorrect(Boolean.TRUE.equals(ar.getIsCorrect()));
                    list.add(a);
                }
            }
        }

        return answerRepository.saveAll(list);
    }

    private List<PassageMediaResponse> toPassageMediaResponses(String passageId) {
        if (passageId == null) {
            return List.of();
        }
        return passageMediaRepository.findByPassageIdOrderByIdAsc(passageId).stream()
                .map(passageMediaMapper::toResponse)
                .toList();
    }

    private void appendUploadedFilesToPassage(String passageId, Collection<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) {
            return;
        }
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            savePassageMediaFile(passageId, file);
        }
    }

    private void savePassageMediaFile(String passageId, MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        String uploadedUrl;
        PassageMedia.MediaType mediaType;
        if (contentType != null && contentType.startsWith("audio")) {
            uploadedUrl = cloudinaryService.uploadAudio(file);
            mediaType = PassageMedia.MediaType.AUDIO;
        } else if (contentType != null && contentType.startsWith("image")) {
            uploadedUrl = cloudinaryService.uploadImage(file);
            mediaType = PassageMedia.MediaType.IMAGE;
        } else {
            uploadedUrl = cloudinaryService.uploadDocument(file);
            mediaType = PassageMedia.MediaType.DOCUMENT;
        }
        PassageMedia media = new PassageMedia();
        media.setPassageId(passageId);
        media.setMediaUrl(uploadedUrl);
        media.setMediaType(mediaType);
        passageMediaRepository.save(media);
    }

    private QuestionAdminResponse buildQuestionAdminResponse(Question question, Passage passage,
                                                             List<Answer> answerEntities) {
        String examTypeId = examPartRepository.findById(question.getExamPartId())
                .map(ExamPart::getExamTypeId).orElse(null);
        PassageResponse passageDto = null;
        if (passage != null) {
            passageDto = passageMapper.toResponse(passage);
        }
        List<PassageMediaResponse> passageMedia = passage != null
                ? toPassageMediaResponses(passage.getPassageId())
                : List.of();
        List<AnswerAdminResponse> answerDtos = answerEntities.stream()
                .map(answerMapper::toAdminResponse)
                .toList();
        return questionMapper.toAdminResponseFull(
                question,
                examTypeId,
                passageDto,
                passageMedia,
                answerDtos,
                tagService.getTagsByQuestionId(question.getQuestionId()));
    }

    public QuestionAdminResponse getQuestionDetailAdmin(String questionId, String currentUserId) {

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found"));
        if (currentUserId == null
                || (!currentUserId.equals(question.getCreatedBy())
                        && !authUtils.hasPermission(PermissionCatalog.QUESTION_MANAGE))) {
            throw new ForbiddenException("Bạn không có quyền xem chi tiết câu hỏi này.");
        }

        String examTypeId = examPartRepository.findById(question.getExamPartId())
                .map(ExamPart::getExamTypeId)
                .orElse(null);

        Passage passageEntity = Optional.ofNullable(question.getPassageId())
                .flatMap(passageRepository::findById)
                .orElse(null);
        PassageResponse passageDto = passageEntity != null
                ? passageMapper.toResponse(passageEntity)
                : null;
        List<PassageMediaResponse> passageMedia = passageEntity != null
                ? toPassageMediaResponses(passageEntity.getPassageId())
                : List.of();

        List<AnswerAdminResponse> answers = answerRepository.findByQuestionId(questionId)
                .stream()
                .map(answerMapper::toAdminResponse)
                .toList();

        return questionMapper.toAdminResponseFull(
                question,
                examTypeId,
                passageDto,
                passageMedia,
                answers,
                tagService.getTagsByQuestionId(questionId));
    }

    @Transactional
    public QuestionAdminResponse updateQuestion(String questionId, QuestionCreateRequest request, String currentUserId) {
        return updateQuestion(questionId, request, currentUserId, null);
    }

    @Transactional
    public QuestionAdminResponse updateQuestion(
            String questionId,
            QuestionCreateRequest request,
            String currentUserId,
            Map<String, MultipartFile> files
    ) {
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng từ token.");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Câu hỏi không tồn tại."));
        if (!currentUserId.equals(question.getCreatedBy()) && !authUtils.hasPermission(PermissionCatalog.QUESTION_MANAGE)) {
            throw new ForbiddenException("Chỉ người tạo câu hỏi mới được sửa.");
        }

        String effectiveClassId = request.getClassId() != null ? request.getClassId() : question.getClassId();
        String effectiveChapterId = request.getChapterId() != null ? request.getChapterId() : question.getChapterId();
        if (request.getClassId() != null || request.getChapterId() != null) {
            requireClassWriteAccess(effectiveClassId, effectiveChapterId, currentUserId);
        }

        applyScalarFields(question, request);
        Passage passage = upsertPassage(question, request);
        passage = appendFilesToPassage(question, passage, request, files);
        syncExtraTextContents(passage, request);

        question = questionRepository.save(question);
        List<Answer> updatedAnswers = answerService.syncAnswers(questionId, request.getAnswers());

        if (request.getTagIds() != null) {
            tagService.syncQuestionTags(questionId, request.getTagIds());
        }

        return buildQuestionAdminResponse(question, passage, updatedAnswers);
    }

    private void applyScalarFields(Question question, QuestionCreateRequest request) {
        if (request.getExamPartId() != null) question.setExamPartId(request.getExamPartId());
        if (request.getClassId() != null) question.setClassId(request.getClassId());
        if (request.getChapterId() != null) question.setChapterId(request.getChapterId());
        if (request.getQuestionText() != null) question.setQuestionText(request.getQuestionText());
        if (request.getQuestionType() != null) question.setQuestionType(request.getQuestionType());
        if (request.getIsBank() != null) question.setIsBank(request.getIsBank());

        if (request.getExplanation() != null) {
            question.setExplanation(request.getExplanation().isBlank() ? null : request.getExplanation());
        }

        if (request.getCollectionId() != null && !request.getCollectionId().isBlank()) {
            question.setCollectionId(request.getCollectionId());
        } else if (request.getCollectionId() != null && request.getCollectionId().isBlank()) {
            question.setCollectionId(null);
        }
        if (request.getAnswers() != null) {
            validateQuestionAnswers(question.getQuestionType(), request.getAnswers());
        }
    }

    private Passage upsertPassage(Question question, QuestionCreateRequest request) {
        Passage passage = null;
        if (request.getPassage() != null && hasPassageContent(request.getPassage())) {
            if (question.getPassageId() != null) {
                passage = passageRepository.findById(question.getPassageId()).orElse(null);
                if (passage != null) {
                    passage.setContent(request.getPassage().getContent() != null ? request.getPassage().getContent() : "");
                    passage.setContentTranslation(request.getPassage().getContentTranslation());
                    passage.setPassageType(request.getPassage().getPassageType());
                    if (request.getPassage().getMediaUrl() != null) {
                        passage.setMediaUrl(request.getPassage().getMediaUrl());
                    }
                    passage = passageRepository.save(passage);
                }
            }
            if (passage == null) {
                passage = new Passage();
                passage.setContent(request.getPassage().getContent() != null ? request.getPassage().getContent() : "");
                passage.setContentTranslation(request.getPassage().getContentTranslation());
                passage.setPassageType(request.getPassage().getPassageType());
                passage.setMediaUrl(request.getPassage().getMediaUrl());
                passage = passageRepository.save(passage);
                question.setPassageId(passage.getPassageId());
            }
        } else {
            if (question.getPassageId() != null) {
                passage = passageRepository.findById(question.getPassageId()).orElse(null);
            }
        }
        return passage;
    }

    private Passage appendFilesToPassage(Question question, Passage passage,
                                         QuestionCreateRequest request, Map<String, MultipartFile> files) {
        boolean hasNewFiles = files != null
                && files.values().stream().anyMatch(f -> f != null && !f.isEmpty());
        if (!hasNewFiles) {
            return passage;
        }
        if (passage == null) {
            Passage newPassage = new Passage();
            newPassage.setContent("");
            Passage.PassageType type = Passage.PassageType.READING;
            if (request.getPassage() != null && request.getPassage().getPassageType() != null) {
                type = request.getPassage().getPassageType();
            } else {
                for (MultipartFile f : files.values()) {
                    if (f != null && !f.isEmpty() && f.getContentType() != null
                            && f.getContentType().startsWith("audio")) {
                        type = Passage.PassageType.LISTENING;
                        break;
                    }
                }
            }
            newPassage.setPassageType(type);
            passage = passageRepository.save(newPassage);
            question.setPassageId(passage.getPassageId());
        }
        try {
            appendUploadedFilesToPassage(passage.getPassageId(), files.values());
        } catch (IOException e) {
            throw new BadRequestException("Upload file thất bại: " + e.getMessage(), e);
        }
        return passageRepository.findById(passage.getPassageId()).orElse(passage);
    }

    private void syncExtraTextContents(Passage passage, QuestionCreateRequest request) {
        if (passage != null && request.getPassage() != null
                && request.getPassage().getExtraContents() != null) {
            passageMediaRepository.deleteByPassageIdAndMediaType(
                    passage.getPassageId(), PassageMedia.MediaType.TEXT);
            for (String extra : request.getPassage().getExtraContents()) {
                if (extra == null || extra.trim().isEmpty()) continue;
                PassageMedia textMedia = new PassageMedia();
                textMedia.setPassageId(passage.getPassageId());
                textMedia.setContent(extra);
                textMedia.setMediaType(PassageMedia.MediaType.TEXT);
                passageMediaRepository.save(textMedia);
            }
        }
    }

    @Transactional
    public List<QuestionAdminResponse> createBulkGroups(
            BulkPassageGroupRequest request,
            String currentUserId,
            Map<String, MultipartFile> files
    ) throws IOException {

        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng.");
        }

        requireClassWriteAccess(request.getClassId(), request.getChapterId(), currentUserId);

        List<QuestionAdminResponse> allResponses = new ArrayList<>();
        int baseMax = resolveMaxQuestionNumber(
                request.getExamPartId(), request.getClassId(), request.getChapterId(), currentUserId);
        int batchIndex = 0;

        for (int gIndex = 0; gIndex < request.getGroups().size(); gIndex++) {
            final int finalGIndex = gIndex;

            PassageQuestionGroupRequest group = request.getGroups().get(gIndex);
            PassageRequest pReq = group.getPassage();

            Passage passage = new Passage();
            passage.setContent(pReq.getContent() != null ? pReq.getContent() : "");
            passage.setContentTranslation(pReq.getContentTranslation());
            passage.setPassageType(pReq.getPassageType());

            passage = passageRepository.save(passage);

            if (pReq.getExtraContents() != null) {
                for (String extra : pReq.getExtraContents()) {
                    if (extra == null || extra.trim().isEmpty()) continue;
                    PassageMedia textMedia = new PassageMedia();
                    textMedia.setPassageId(passage.getPassageId());
                    textMedia.setContent(extra);
                    textMedia.setMediaType(PassageMedia.MediaType.TEXT);
                    passageMediaRepository.save(textMedia);
                }
            }

            if (files != null) {

                List<MultipartFile> mediaFiles = files.entrySet().stream()
                        .filter(e -> e.getKey().startsWith("media_" + finalGIndex + "_"))
                        .map(Map.Entry::getValue)
                        .toList();

                for (MultipartFile file : mediaFiles) {
                    if (file == null || file.isEmpty()) continue;
                    savePassageMediaFile(passage.getPassageId(), file);
                }
            }

            for (NormalQuestionRequest qReq : group.getQuestions()) {

                Question question = new Question();
                question.setExamPartId(request.getExamPartId());
                question.setPassageId(passage.getPassageId());
                question.setQuestionText(qReq.getQuestionText());
                question.setQuestionType(qReq.getQuestionType());
                question.setExplanation(qReq.getExplanation());
                question.setCreatedBy(currentUserId);
                question.setIsBank(true);

                if (request.getClassId() != null)
                    question.setClassId(request.getClassId());

                if (request.getChapterId() != null)
                    question.setChapterId(request.getChapterId());

                if (qReq.getCollectionId() != null)
                    question.setCollectionId(qReq.getCollectionId());

                question.setQuestionNumber(resolveBankQuestionNumber(baseMax, qReq, batchIndex++));
                question = questionRepository.save(question);

                List<Answer> savedAnswers =
                        saveAnswersForQuestion(
                                question.getQuestionId(),
                                qReq.getAnswers(),
                                qReq.getQuestionType()
                        );

                attachImportTags(question.getQuestionId(), question.getExamPartId(), qReq.getTagIds(), qReq.getTagNames());

                allResponses.add(
                        buildQuestionAdminResponse(
                                question,
                                passage,
                                savedAnswers
                        )
                );
            }
        }

        return allResponses;
    }

    private int resolveMaxQuestionNumber(
            String examPartId,
            String classId,
            String chapterId,
            String createdBy
    ) {
        Integer max;
        if (classId != null && chapterId != null) {
            max = questionRepository.findMaxQuestionNumberByExamPartAndClassAndChapter(
                    examPartId, classId, chapterId);
        } else if (classId != null) {
            max = questionRepository.findMaxQuestionNumberByExamPartAndClass(examPartId, classId);
        } else {
            max = questionRepository.findMaxQuestionNumberPersonal(examPartId, createdBy);
        }
        return max == null ? 0 : max;
    }

    private int resolveBankQuestionNumber(int baseMax, NormalQuestionRequest qReq, int batchIndex) {
        if (qReq.getQuestionNumber() != null && qReq.getQuestionNumber() > 0) {
            return baseMax + qReq.getQuestionNumber();
        }
        return baseMax + batchIndex + 1;
    }

}
