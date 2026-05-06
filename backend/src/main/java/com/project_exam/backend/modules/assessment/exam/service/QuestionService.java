package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.infrastructure.cloudinary.CloudinaryService;
import com.project_exam.backend.modules.auth.dto.*;
import com.project_exam.backend.modules.users.dto.*;
import com.project_exam.backend.modules.posts.dto.*;
import com.project_exam.backend.modules.assessment.exam.dto.*;
import com.project_exam.backend.modules.assessment.test.dto.*;
import com.project_exam.backend.modules.assessment.attempt.dto.*;
import com.project_exam.backend.modules.vocabulary.dto.*;
import com.project_exam.backend.modules.classroom.dto.*;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import com.project_exam.backend.modules.users.domain.*;
import com.project_exam.backend.modules.posts.domain.*;
import com.project_exam.backend.modules.assessment.exam.domain.*;
import com.project_exam.backend.modules.assessment.test.domain.*;
import com.project_exam.backend.modules.assessment.attempt.domain.*;
import com.project_exam.backend.modules.vocabulary.domain.*;
import com.project_exam.backend.modules.classroom.domain.*;
import com.project_exam.backend.modules.audit.domain.*;
import com.project_exam.backend.modules.users.repository.*;
import com.project_exam.backend.modules.posts.repository.*;
import com.project_exam.backend.modules.assessment.exam.repository.*;
import com.project_exam.backend.modules.assessment.test.repository.*;
import com.project_exam.backend.modules.assessment.attempt.repository.*;
import com.project_exam.backend.modules.vocabulary.repository.*;
import com.project_exam.backend.modules.classroom.repository.*;
import com.project_exam.backend.modules.audit.repository.*;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class QuestionService {
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final PassageRepository passageRepository;
    private final ExamPartRepository examPartRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestPartRepository testPartRepository;
    private final CloudinaryService cloudinaryService;
    private final AuthUtils authUtils;
    private final PassageMediaRepository passageMediaRepository;
    private final AnswerService answerService;
    private final ClassMemberRepository classMemberRepository;
    private final ClassRepository classRepository;
    private final QuestionDocumentImportService questionDocumentImportService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    public List<Question> findAll() {
        return questionRepository.findAll();
    }

    public List<QuestionAdminResponse> findAllAdminSummaries() {
        return findAll().stream()
                .map(question -> QuestionAdminResponse.builder()
                        .questionId(question.getQuestionId())
                        .examPartId(question.getExamPartId())
                        .questionText(question.getQuestionText())
                        .questionType(question.getQuestionType())
                        .explanation(question.getExplanation())
                        .classId(question.getClassId())
                        .isBank(question.getIsBank())
                        .examTypeId(null)
                        .passage(null)
                        .passageMedia(List.of())
                        .answers(List.of())
                        .build())
                .toList();
    }

    public Optional<Question> findById(String id) {
        return questionRepository.findById(id);
    }

    public Question save(Question question) {
        return questionRepository.save(question);
    }

    /**
     * Lấy danh sách câu theo part.
     * Cá nhân (classId == null): chỉ câu của user đăng nhập (created_by = currentUserId, class_id/chapter_id NULL).
     * Lớp: classId (+ chapterId nếu có).
     */
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

        // 🚀 TỐI ƯU: Chỉ 1 câu Query duy nhất cho tất cả Passage
        List<PassageMedia> allMedia = passageMediaRepository.findByPassageIdIn(passageIds);

        // Dùng Stream API để nhóm (groupingBy) media theo passageId ngay trên RAM
        return allMedia.stream()
                .map(m -> new PassageMediaResponse(
                        m.getId(),
                        m.getPassageId(),
                        m.getMediaUrl(),
                        m.getMediaType().name()
                ))
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
                passageResponse = new PassageResponse(
                        passage.getPassageId(),
                        passage.getContent(),
                        passage.getMediaUrl(),
                        passage.getPassageType()
                );
            }
        }

        List<PassageMediaResponse> passageMedia = (question.getPassageId() == null)
                ? List.of()
                : mediaByPassageId.getOrDefault(question.getPassageId(), List.of());

        // Lấy danh sách đáp án theo đúng thứ tự hiện tại
        List<AnswerResponse> answers = new ArrayList<>(answersByQuestionId.getOrDefault(
                question.getQuestionId(),
                Collections.emptyList()
        ));

        return QuestionResponse.builder()
                .questionId(question.getQuestionId())
                .examPartId(question.getExamPartId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .isBank(question.getIsBank())
                .passage(passageResponse)
                .passageMedia(passageMedia)
                .answers(answers)
                .build();
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
            HttpServletRequest request
    ) {

        String currentUserId = authUtils.getUserId(request);

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

    /**
     * Lấy kho admin: câu hỏi do bất kỳ admin nào tạo, không gắn class/chapter, là kho.
     * Bất kỳ user đăng nhập nào cũng đọc được để dùng làm nguồn tạo đề.
     */
    public List<QuestionResponse> getAdminBankQuestionsByPart(String examPartId, HttpServletRequest request) {
        authUtils.getUserId(request); // bắt buộc đăng nhập
        Set<String> adminIds = getAdminUserIds();
        if (adminIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<Question> questions = questionRepository.findAdminBankByExamPart(examPartId, adminIds);
        if (questions.isEmpty()) {
            return Collections.emptyList();
        }
        return buildUserQuestionResponses(questions);
    }

    public long countAdminBankQuestionsByPart(String examPartId, HttpServletRequest request) {
        authUtils.getUserId(request);
        Set<String> adminIds = getAdminUserIds();
        if (adminIds.isEmpty()) {
            return 0L;
        }
        return questionRepository.countAdminBankByExamPart(examPartId, adminIds);
    }

    private Set<String> getAdminUserIds() {
        Role adminRole = roleRepository.findByRoleName("ADMIN");
        if (adminRole == null) {
            return Collections.emptySet();
        }
        return userRepository.findByRoleId(adminRole.getRoleId()).stream()
                .map(User::getUserId)
                .collect(Collectors.toSet());
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
            HttpServletRequest request
    ) {
        String currentUserId = authUtils.getUserId(request);
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
            HttpServletRequest request
    ) {
        String currentUserId = authUtils.getUserId(request);
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

    public List<PassageQuestionGroup> previewPassageQuestionsFromDocument(MultipartFile file) throws IOException {
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
            HttpServletRequest httpRequest
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

        return createBulkQuestionsToBankNoPassage(bulkRequest, httpRequest, Collections.emptyMap());
    }

    @Transactional
    public List<QuestionAdminResponse> createQuestionsFromDocumentAndAttachToTest(
            MultipartFile file,
            String testPartId,
            String classId,
            String chapterId,
            HttpServletRequest httpRequest
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn file Word.");
        }
        if (testPartId == null) {
            throw new BadRequestException("Thiếu testPartId.");
        }

        String currentUserId = authUtils.getUserId(httpRequest);
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng.");
        }

        TestPart testPart = testPartRepository.findById(testPartId)
                .orElseThrow(() -> new NotFoundException("TestPart không tồn tại: " + testPartId));

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
            question.setCreatedBy(currentUserId);
            question.setIsBank(Boolean.FALSE);
            if (classId != null) {
                question.setClassId(classId);
            }
            if (chapterId != null) {
                question.setChapterId(chapterId);
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

            responses.add(buildQuestionAdminResponse(question, null, savedAnswers));
        }

        return responses;
    }

    public void deleteById(String id) {
        questionRepository.deleteById(id);
    }

    /**
     * Đếm câu theo part. Cá nhân = theo user đăng nhập; lớp = classId (+ chapterId nếu có).
     */
    public long countByExamPartId(String examPartId, String classId, String chapterId, HttpServletRequest request) {
        String currentUserId = authUtils.getUserId(request);
        if (classId != null) {
            if (chapterId != null) {
                return questionRepository.countByExamPartIdAndClassIdAndChapterId(examPartId, classId, chapterId);
            }
            return questionRepository.countByExamPartIdAndClassId(examPartId, classId);
        }
        return questionRepository.countByExamPartIdAndCreatedByAndClassIdIsNullAndChapterIdIsNullAndIsBankTrue(examPartId, currentUserId);
    }

    /**
     * Tạo nhiều câu hỏi cùng 1 passage vào kho (BẮT BUỘC lưu kho, BẮT BUỘC có passage).
     * Passage trong request là bắt buộc cho bulk; nếu LISTENING có thể kèm file audio.
     */
    @Transactional
    public List<QuestionAdminResponse> createBulkQuestionsToBank(BulkQuestionWithPassageRequest request,
                                                                HttpServletRequest httpRequest,
                                                                Map<String, MultipartFile> files) throws IOException {
        String currentUserId = authUtils.getUserId(httpRequest);
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng từ token.");
        }
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
        passage.setPassageType(request.getPassage().getPassageType());
        if (hasMediaUrl) {
            passage.setMediaUrl(request.getPassage().getMediaUrl());
        } else {
            passage.setMediaUrl(null);
        }
        passage = passageRepository.save(passage);
        String passageId = passage.getPassageId();
        for (MultipartFile file : uploadedFiles) {
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

        List<QuestionAdminResponse> responses = new ArrayList<>();
        for (NormalQuestionRequest qReq : request.getQuestions()) {
            Question question = new Question();
            question.setExamPartId(request.getExamPartId());
            question.setPassageId(passageId);
            question.setQuestionText(qReq.getQuestionText());
            question.setQuestionType(qReq.getQuestionType());
            question.setCreatedBy(currentUserId);
            if (request.getClassId() != null) question.setClassId(request.getClassId());
            if (request.getChapterId() != null) question.setChapterId(request.getChapterId());
            question.setIsBank(Boolean.TRUE);
            question = questionRepository.save(question);

            List<Answer> savedAnswers = saveAnswersForQuestion(question.getQuestionId(), qReq.getAnswers(), qReq.getQuestionType());
            responses.add(buildQuestionAdminResponse(question, passage, savedAnswers));
        }
        return responses;
    }

    /**
     * Tạo nhiều câu hỏi thông thường vào kho (không passage). Mỗi câu độc lập.
     */
    @Transactional
    public List<QuestionAdminResponse> createBulkQuestionsToBankNoPassage(
            BulkCreateQuestionsToBankRequest request,
            HttpServletRequest httpRequest,
            Map<String, MultipartFile> files
    ) throws IOException {

        String currentUserId = authUtils.getUserId(httpRequest);
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng từ token.");
        }

        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            return List.of();
        }

        List<QuestionAdminResponse> responses = new ArrayList<>();

        for (int i = 0; i < request.getQuestions().size(); i++) {

            final int questionIndex = i;
            NormalQuestionRequest qReq = request.getQuestions().get(i);

            Question question = new Question();
            question.setExamPartId(request.getExamPartId());
            question.setPassageId(null);
            question.setQuestionText(qReq.getQuestionText());
            question.setQuestionType(qReq.getQuestionType());
            question.setCreatedBy(currentUserId);
            question.setIsBank(Boolean.TRUE);

            if (request.getClassId() != null)
                question.setClassId(request.getClassId());

            if (request.getChapterId() != null)
                question.setChapterId(request.getChapterId());

            question = questionRepository.save(question);

            // 🔥 Lấy toàn bộ file của câu hỏi này
            List<MultipartFile> questionFiles = files.entrySet().stream()
                    .filter(e -> e.getKey().startsWith("media_" + questionIndex + "_"))
                    .map(Map.Entry::getValue)
                    .toList();

            if (!questionFiles.isEmpty()) {

                // 1. Tạo đối tượng Passage mới
                Passage passage = new Passage();
                passage.setContent("");

                // --- ĐOẠN SỬA ĐỂ NHẬN DIỆN LOẠI ---
                // Mặc định là READING (cho ảnh), nếu thấy file audio thì chuyển thành LISTENING
                Passage.PassageType determinedType = Passage.PassageType.READING;

                for (MultipartFile file : questionFiles) {
                    if (file != null && file.getContentType() != null) {
                        if (file.getContentType().startsWith("audio")) {
                            determinedType = Passage.PassageType.LISTENING;
                            break; // Ưu tiên LISTENING nếu có file âm thanh
                        }
                    }
                }

                passage.setPassageType(determinedType);
                // ---------------------------------

                passage = passageRepository.save(passage);

                question.setPassageId(passage.getPassageId());
                questionRepository.save(question);

                for (MultipartFile file : questionFiles) {
                    if (file == null || file.isEmpty()) continue;

                    String uploadedUrl;
                    PassageMedia.MediaType mediaType;

                    // Tối ưu: Dựa vào ContentType của file để gọi Cloudinary tương ứng
                    if (file.getContentType() != null && file.getContentType().startsWith("audio")) {
                        uploadedUrl = cloudinaryService.uploadAudio(file);
                        mediaType = PassageMedia.MediaType.AUDIO;
                    } else {
                        uploadedUrl = cloudinaryService.uploadImage(file);
                        mediaType = PassageMedia.MediaType.IMAGE;
                    }

                    PassageMedia media = new PassageMedia();
                    media.setPassageId(passage.getPassageId());
                    media.setMediaUrl(uploadedUrl);
                    media.setMediaType(mediaType);

                    passageMediaRepository.save(media);
                }
            }

            List<Answer> savedAnswers = saveAnswersForQuestion(
                    question.getQuestionId(),
                    qReq.getAnswers(),
                    qReq.getQuestionType()
            );

            responses.add(
                    buildQuestionAdminResponse(question, null, savedAnswers)
            );
        }

        return responses;
    }

    /**
     * Tạo câu hỏi "tức thì" (isBank = false) và gắn thẳng vào part của đề.
     * Dùng khi giáo viên trên lớp đặt câu hỏi rồi đưa vào đề, không cần lưu kho.
     */
    @Transactional
    public QuestionAdminResponse createQuestionAndAttachToTest(
            CreateQuestionAndAttachRequest request,
            HttpServletRequest httpRequest,
            Map<String, MultipartFile> files // Chuyển sang Map để nhận đa file
    ) throws IOException {

        String currentUserId = authUtils.getUserId(httpRequest);
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng.");
        }

        TestPart testPart = testPartRepository.findById(request.getTestPartId())
                .orElseThrow(() -> new NotFoundException("TestPart không tồn tại: " + request.getTestPartId()));

        String passageId = null;
        Passage savedPassage = null;

        // Kiểm tra xem có file nào gửi lên không hoặc có content passage không
        boolean hasFiles = files != null && !files.isEmpty();
        boolean hasPassageReq = request.getPassage() != null;

        if (hasFiles || (hasPassageReq && hasPassageContent(request.getPassage()))) {
            Passage passage = new Passage();
            if (hasPassageReq) {
                passage.setContent(request.getPassage().getContent() != null ? request.getPassage().getContent() : "");
                passage.setPassageType(request.getPassage().getPassageType());
            } else {
                // Mặc định nếu chỉ có file mà không có request passage
                passage.setContent("");
                passage.setPassageType(Passage.PassageType.LISTENING);
            }

            savedPassage = passageRepository.save(passage);
            passageId = savedPassage.getPassageId();

            // 🔥 XỬ LÝ ĐA PHƯƠNG TIỆN (Lưu vào passage_media)
            // 🔥 XỬ LÝ ĐA PHƯƠNG TIỆN (Lưu vào passage_media)
            if (hasFiles) {
                for (MultipartFile file : files.values()) {

                    if (file == null || file.isEmpty()) continue;

                    String contentType = file.getContentType();

                    String uploadedUrl;
                    PassageMedia.MediaType mediaType;

                    if (contentType != null && contentType.startsWith("image")) {
                        uploadedUrl = cloudinaryService.uploadImage(file);
                        mediaType = PassageMedia.MediaType.IMAGE;
                    } else if (contentType != null && contentType.startsWith("audio")) {
                        uploadedUrl = cloudinaryService.uploadAudio(file);
                        mediaType = PassageMedia.MediaType.AUDIO;
                    } else {
                        // PDF / DOC / XLS ...
                        uploadedUrl = cloudinaryService.uploadDocument(file);
                        mediaType = PassageMedia.MediaType.DOCUMENT;
                    }

                    PassageMedia media = new PassageMedia();
                    media.setPassageId(passageId);
                    media.setMediaUrl(uploadedUrl);
                    media.setMediaType(mediaType);

                    passageMediaRepository.save(media);
                }
            }
        }

            // Lưu Question
        Question question = new Question();
        question.setExamPartId(testPart.getExamPartId());
        question.setPassageId(passageId);
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setCreatedBy(currentUserId);
        question.setIsBank(Boolean.FALSE);

        if (request.getClassId() != null) question.setClassId(request.getClassId());
        if (request.getChapterId() != null) question.setChapterId(request.getChapterId());

        question = questionRepository.save(question);

        // Lưu Answers
        List<Answer> savedAnswers = saveAnswersForQuestion(
                question.getQuestionId(),
                request.getAnswers(),
                request.getQuestionType()
        );

        // Gán vào Test
        TestQuestion tq = new TestQuestion();
        tq.setTestPartId(request.getTestPartId());
        tq.setQuestionId(question.getQuestionId());
        tq.setDisplayOrder(testQuestionRepository.findMaxDisplayOrderByTestPartId(request.getTestPartId()) + 1);
        testQuestionRepository.save(tq);

        return buildQuestionAdminResponse(question, savedPassage, savedAnswers);
    }

    private boolean hasPassageContent(PassageRequest pr) {
        return (pr.getContent() != null && !pr.getContent().trim().isEmpty()) || pr.getMediaUrl() != null;
    }

    private void validateQuestionAnswers(Question.QuestionType questionType, List<AnswerRequest> answers) {
        if (questionType != Question.QuestionType.MCQ) {
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
                // ESSAY: user tự viết câu trả lời, không cần tạo đáp án trắc nghiệm
                // Có thể lưu một đáp án mẫu nếu teacher muốn cung cấp gợi ý
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
            case MCQ -> {
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
                // fallback: xử lý như MCQ
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
        return passageMediaRepository.findByPassageId(passageId).stream()
                .map(m -> new PassageMediaResponse(
                        m.getId(),
                        m.getPassageId(),
                        m.getMediaUrl(),
                        m.getMediaType().name()
                ))
                .toList();
    }

    /**
     * Upload thêm file vào passage (append vào passage_media). Giống luồng create-and-attach.
     */
    private void appendUploadedFilesToPassage(String passageId, Collection<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) {
            return;
        }
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            String contentType = file.getContentType();
            String uploadedUrl;
            PassageMedia.MediaType mediaType;
            if (contentType != null && contentType.startsWith("image")) {
                uploadedUrl = cloudinaryService.uploadImage(file);
                mediaType = PassageMedia.MediaType.IMAGE;
            } else if (contentType != null && contentType.startsWith("audio")) {
                uploadedUrl = cloudinaryService.uploadAudio(file);
                mediaType = PassageMedia.MediaType.AUDIO;
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
    }

    private QuestionAdminResponse buildQuestionAdminResponse(Question question, Passage passage,
                                                             List<Answer> answerEntities) {
        String examTypeId = examPartRepository.findById(question.getExamPartId())
                .map(ExamPart::getExamTypeId).orElse(null);
        PassageResponse passageDto = null;
        if (passage != null) {
            passageDto = new PassageResponse(
                    passage.getPassageId(),
                    passage.getContent(),
                    passage.getMediaUrl(),
                    passage.getPassageType()
            );
        }
        List<PassageMediaResponse> passageMedia = passage != null
                ? toPassageMediaResponses(passage.getPassageId())
                : List.of();
        List<AnswerAdminResponse> answerDtos = answerEntities.stream()
                .map(a -> AnswerAdminResponse.builder()
                        .answerId(a.getAnswerId())
                        .answerText(a.getAnswerText())
                        .answerLabel(a.getAnswerLabel())
                        .isCorrect(a.getIsCorrect())
                        .build()
                )
                .toList();
        return QuestionAdminResponse.builder()
                .questionId(question.getQuestionId())
                .examPartId(question.getExamPartId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .explanation(question.getExplanation())
                .examTypeId(examTypeId)
                .classId(question.getClassId())
                .isBank(question.getIsBank())
                .passage(passageDto)
                .passageMedia(passageMedia)
                .answers(answerDtos)
                .build();
    }

    public QuestionAdminResponse getQuestionDetailAdmin(String questionId) {

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found"));

        String examTypeId = examPartRepository.findById(question.getExamPartId())
                .map(ExamPart::getExamTypeId)
                .orElse(null);

        Passage passageEntity = Optional.ofNullable(question.getPassageId())
                .flatMap(passageRepository::findById)
                .orElse(null);
        PassageResponse passageDto = passageEntity != null
                ? new PassageResponse(
                passageEntity.getPassageId(),
                passageEntity.getContent(),
                passageEntity.getMediaUrl(),
                passageEntity.getPassageType()
        )
                : null;
        List<PassageMediaResponse> passageMedia = passageEntity != null
                ? toPassageMediaResponses(passageEntity.getPassageId())
                : List.of();

        List<AnswerAdminResponse> answers = answerRepository.findByQuestionId(questionId)
                .stream()
                .map(a -> AnswerAdminResponse.builder()
                        .answerId(a.getAnswerId())
                        .answerText(a.getAnswerText())
                        .answerLabel(a.getAnswerLabel())
                        .isCorrect(a.getIsCorrect())
                        .build()
                )
                .toList();

        return QuestionAdminResponse.builder()
                .questionId(question.getQuestionId())
                .examPartId(question.getExamPartId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .explanation(question.getExplanation())
                .examTypeId(examTypeId)
                .classId(question.getClassId())
                .isBank(question.getIsBank())
                .passage(passageDto)
                .passageMedia(passageMedia)
                .answers(answers)
                .build();
    }

    /**
     * Cập nhật câu hỏi (JSON). Đồng bộ đáp án theo {@link AnswerService#syncAnswers}.
     */
    @Transactional
    public QuestionAdminResponse updateQuestion(String questionId, QuestionCreateRequest request, HttpServletRequest httpRequest) {
        return updateQuestion(questionId, request, httpRequest, null);
    }

    /**
     * Cập nhật câu hỏi; {@code files} (multipart) được append vào {@code passage_media} của passage liên kết.
     */
    @Transactional
    public QuestionAdminResponse updateQuestion(
            String questionId,
            QuestionCreateRequest request,
            HttpServletRequest httpRequest,
            Map<String, MultipartFile> files
    ) {
        String currentUserId = authUtils.getUserId(httpRequest);
        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng từ token.");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Câu hỏi không tồn tại."));
        if (!currentUserId.equals(question.getCreatedBy())) {
            throw new ForbiddenException("Chỉ người tạo câu hỏi mới được sửa.");
        }

        if (request.getExamPartId() != null) question.setExamPartId(request.getExamPartId());
        if (request.getClassId() != null) question.setClassId(request.getClassId());
        if (request.getChapterId() != null) question.setChapterId(request.getChapterId());
        if (request.getQuestionText() != null) question.setQuestionText(request.getQuestionText());
        if (request.getQuestionType() != null) question.setQuestionType(request.getQuestionType());
        if (request.getIsBank() != null) question.setIsBank(request.getIsBank());
        if (request.getAnswers() != null) {
            validateQuestionAnswers(question.getQuestionType(), request.getAnswers());
        }

        Passage passage = null;
        if (request.getPassage() != null && hasPassageContent(request.getPassage())) {
            if (question.getPassageId() != null) {
                passage = passageRepository.findById(question.getPassageId()).orElse(null);
                if (passage != null) {
                    passage.setContent(request.getPassage().getContent() != null ? request.getPassage().getContent() : "");
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

        boolean hasNewFiles = files != null
                && files.values().stream().anyMatch(f -> f != null && !f.isEmpty());
        if (hasNewFiles) {
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
            passage = passageRepository.findById(passage.getPassageId()).orElse(passage);
        }

        question = questionRepository.save(question);
        List<Answer> updatedAnswers = answerService.syncAnswers(questionId, request.getAnswers());

        return buildQuestionAdminResponse(question, passage, updatedAnswers);
    }

    @Transactional
    public List<QuestionAdminResponse> createBulkGroups(
            BulkPassageGroupRequest request,
            HttpServletRequest httpRequest,
            Map<String, MultipartFile> files
    ) throws IOException {

        String currentUserId = authUtils.getUserId(httpRequest);

        if (currentUserId == null) {
            throw new BadRequestException("Không xác định được người dùng.");
        }

        System.out.println("========== DEBUG START ==========");
        if (files != null) {
            System.out.println("Tổng số lượng file nhận được từ Controller: " + files.size());
            System.out.println("Danh sách các Key file: " + files.keySet());
        } else {
            System.out.println("Biến 'files' bị NULL!");
        }

        List<QuestionAdminResponse> allResponses = new ArrayList<>();

        for (int gIndex = 0; gIndex < request.getGroups().size(); gIndex++) {
            final int finalGIndex = gIndex;

            PassageQuestionGroup group = request.getGroups().get(gIndex);
            PassageRequest pReq = group.getPassage();

            // 🔹 SAVE PASSAGE
            Passage passage = new Passage();
            passage.setContent(pReq.getContent() != null ? pReq.getContent() : "");
            passage.setPassageType(pReq.getPassageType());

            passage = passageRepository.save(passage);

            // 🔹 MULTI MEDIA
            if (files != null) {

                List<MultipartFile> mediaFiles = files.entrySet().stream()
                        .filter(e -> e.getKey().startsWith("media_" + finalGIndex + "_"))
                        .map(Map.Entry::getValue)
                        .toList();

                for (MultipartFile file : mediaFiles) {

                    if (file == null || file.isEmpty()) continue;

                    String uploadedUrl;
                    PassageMedia.MediaType mediaType;

                    String contentType = file.getContentType();
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
                    media.setPassageId(passage.getPassageId());
                    media.setMediaUrl(uploadedUrl);
                    media.setMediaType(mediaType);

                    passageMediaRepository.save(media);
                }
            }

            // 🔹 SAVE QUESTIONS
            for (NormalQuestionRequest qReq : group.getQuestions()) {

                Question question = new Question();
                question.setExamPartId(request.getExamPartId());
                question.setPassageId(passage.getPassageId());
                question.setQuestionText(qReq.getQuestionText());
                question.setQuestionType(qReq.getQuestionType());
                question.setCreatedBy(currentUserId);
                question.setIsBank(true);

                if (request.getClassId() != null)
                    question.setClassId(request.getClassId());

                if (request.getChapterId() != null)
                    question.setChapterId(request.getChapterId());

                question = questionRepository.save(question);

                List<Answer> savedAnswers =
                        saveAnswersForQuestion(
                                question.getQuestionId(),
                                qReq.getAnswers(),
                                qReq.getQuestionType()
                        );

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

}
