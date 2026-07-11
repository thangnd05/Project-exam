package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.auth.dto.*;
import com.project_exam.backend.modules.users.dto.*;
import com.project_exam.backend.modules.posts.dto.*;
import com.project_exam.backend.modules.assessment.exam.dto.*;
import com.project_exam.backend.modules.assessment.test.dto.*;
import com.project_exam.backend.modules.assessment.attempt.dto.*;
import com.project_exam.backend.modules.vocabulary.dto.*;
import com.project_exam.backend.modules.classroom.clazz.dto.*;
import com.project_exam.backend.modules.classroom.chapter.dto.*;
import com.project_exam.backend.modules.classroom.member.dto.*;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import com.project_exam.backend.modules.assessment.exam.service.QuestionService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {
    private final QuestionService questionService;
    private final ObjectMapper objectMapper;
    private final AuthUtils authUtils;

    // =================== GET ===================

    @GetMapping
    public ResponseEntity<List<QuestionAdminResponse>> getAllQuestions() {
        return ResponseEntity.ok(questionService.findAllAdminSummaries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionAdminResponse> getQuestionById(@PathVariable String id) {
        QuestionAdminResponse response = questionService.getQuestionDetailAdmin(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy câu hỏi theo part:
     * - bank=admin → kho admin (do admin tạo, public cho mọi user)
     * - Cá nhân: không gửi classId/chapterId (lấy theo user JWT)
     * - Lớp: gửi classId (+ chapterId)
     */
    @GetMapping("/by-part/{examPartId}")
    public ResponseEntity<List<QuestionResponse>> getQuestionsByPart(
            @PathVariable String examPartId,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String chapterId,
            @RequestParam(required = false) String bank,
            HttpServletRequest request
    ) {
        if ("admin".equalsIgnoreCase(bank)) {
            authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
            return ResponseEntity.ok(questionService.getAdminBankQuestionsByPart(examPartId, request));
        }
        List<QuestionResponse> questions = questionService.getQuestionsByPart(examPartId, classId, chapterId, request);
        return ResponseEntity.ok(questions);
    }

    /** Đếm câu hỏi theo part. Hỗ trợ bank=admin tương tự /by-part. */
    @GetMapping("/count/by-part/{examPartId}")
    public ResponseEntity<Long> countQuestionsByPart(
            @PathVariable String examPartId,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String chapterId,
            @RequestParam(required = false) String bank,
            HttpServletRequest request
    ) {
        if ("admin".equalsIgnoreCase(bank)) {
            authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
            return ResponseEntity.ok(questionService.countAdminBankQuestionsByPart(examPartId, request));
        }
        long count = questionService.countByExamPartId(examPartId, classId, chapterId, request);
        return ResponseEntity.ok(count);
    }

    /** Lấy kho câu hỏi theo lớp của user đang login (không cần examPartId). Có thể lọc thêm chapterId. */
    @GetMapping("/bank/my-class")
    public ResponseEntity<List<QuestionResponse>> getBankQuestionsByCurrentUserClass(
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String chapterId,
            HttpServletRequest request
    ) {
        List<QuestionResponse> questions = questionService.getBankQuestionsByCurrentUserClass(classId, chapterId, request);
        return ResponseEntity.ok(questions);
    }

    /** Đếm kho câu hỏi theo lớp của user đang login (không cần examPartId). Có thể lọc thêm chapterId. */
    @GetMapping("/bank/my-class/count")
    public ResponseEntity<Long> countBankQuestionsByCurrentUserClass(
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String chapterId,
            HttpServletRequest request
    ) {
        long count = questionService.countBankQuestionsByCurrentUserClass(classId, chapterId, request);
        return ResponseEntity.ok(count);
    }

    // =================== CREATE ===================
    // Tạo câu hỏi thông thường vào kho (không passage). Gắn đề qua API riêng.

    @PostMapping(
            value = "/bulk",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<List<QuestionAdminResponse>> createBulkQuestionsToBankNoPassage(
            @RequestPart("request") String requestJson,
            HttpServletRequest httpRequest
    ) throws IOException {
        BulkCreateQuestionsToBankRequest request =
                objectMapper.readValue(requestJson, BulkCreateQuestionsToBankRequest.class);
        MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) httpRequest;
        List<QuestionAdminResponse> responses =
                questionService.createBulkQuestionsToBankNoPassage(
                        request,
                        httpRequest,
                        multipartRequest.getFileMap()
                );
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @PostMapping(value = "/bulk-with-passage", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<QuestionAdminResponse>> createBulkQuestionsToBank(
            @RequestPart("request") String requestJson,
            HttpServletRequest httpRequest
    ) throws IOException {
        BulkQuestionWithPassageRequest request =
                objectMapper.readValue(requestJson, BulkQuestionWithPassageRequest.class);
        MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) httpRequest;
        List<QuestionAdminResponse> responses =
                questionService.createBulkQuestionsToBank(request, httpRequest, multipartRequest.getFileMap());
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @PostMapping(value = "/create-and-attach", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuestionAdminResponse> createQuestionAndAttachToTest(
            @RequestPart("request") String requestJson,
            HttpServletRequest httpRequest
    ) throws IOException {

        // Lấy toàn bộ file từ request
        MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) httpRequest;
        Map<String, MultipartFile> files = multipartRequest.getFileMap();

        CreateQuestionAndAttachRequest request =
                objectMapper.readValue(requestJson, CreateQuestionAndAttachRequest.class);

        QuestionAdminResponse result =
                questionService.createQuestionAndAttachToTest(request, httpRequest, files);

        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/create-and-attach/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<QuestionAdminResponse>> createQuestionsFromDocumentAndAttachToTest(
            @RequestPart("file") MultipartFile file,
            @RequestParam String testPartId,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String chapterId,
            HttpServletRequest httpRequest
    ) throws IOException {
        List<QuestionAdminResponse> responses = questionService.createQuestionsFromDocumentAndAttachToTest(
                file,
                testPartId,
                classId,
                chapterId,
                httpRequest
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @PostMapping(value = "/import/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<QuestionAdminResponse>> importQuestionsFromDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam String examPartId,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String chapterId,
            HttpServletRequest httpRequest
    ) throws IOException {
        List<QuestionAdminResponse> responses = questionService.importQuestionsFromDocument(
                file,
                examPartId,
                classId,
                chapterId,
                httpRequest
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @PostMapping(value = "/preview/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<NormalQuestionRequest>> previewQuestionsFromDocument(
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        List<NormalQuestionRequest> responses = questionService.previewQuestionsFromDocument(file);
        return ResponseEntity.ok(responses);
    }

    @PostMapping(value = "/preview/passage-document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<PassageQuestionGroup>> previewPassageQuestionsFromDocument(
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        List<PassageQuestionGroup> responses = questionService.previewPassageQuestionsFromDocument(file);
        return ResponseEntity.ok(responses);
    }

    // =================== UPDATE ===================

    /** Cập nhật câu hỏi (JSON). Body: QuestionCreateRequest (patch). */
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<QuestionAdminResponse> updateQuestion(
            @PathVariable String id,
            @Valid @RequestBody QuestionCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        QuestionAdminResponse response = questionService.updateQuestion(id, request, httpRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật câu hỏi kèm upload ảnh / audio / tài liệu (multipart).
     * Part {@code request}: JSON string {@link QuestionCreateRequest}. Các part file: key tùy ý (vd. {@code file0}, {@code audio}).
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuestionAdminResponse> updateQuestionWithFiles(
            @PathVariable String id,
            @RequestPart("request") String requestJson,
            HttpServletRequest httpRequest
    ) throws IOException {
        MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) httpRequest;
        Map<String, MultipartFile> files = multipartRequest.getFileMap();
        QuestionCreateRequest request =
                objectMapper.readValue(requestJson, QuestionCreateRequest.class);
        QuestionAdminResponse response =
                questionService.updateQuestion(id, request, httpRequest, files);
        return ResponseEntity.ok(response);
    }

    // =================== DELETE ===================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable String id, HttpServletRequest httpRequest) {
        questionService.deleteById(id, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(
            value = "/bulk-groups",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<List<QuestionAdminResponse>> createBulkGroups(
            @RequestPart("request") String requestJson,
            HttpServletRequest httpRequest
    ) throws IOException {

        // 1. Ép kiểu request sang MultipartRequest
        MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) httpRequest;

        // 2. Lấy toàn bộ Map chứa các file (key là tên media_x_x, value là file)
        Map<String, MultipartFile> files = multipartRequest.getFileMap();

        // 3. Parse JSON thủ công
        BulkPassageGroupRequest request =
                objectMapper.readValue(requestJson, BulkPassageGroupRequest.class);

        // 4. Gọi service
        List<QuestionAdminResponse> result =
                questionService.createBulkGroups(request, httpRequest, files);

        return ResponseEntity.ok(result);
    }

}
