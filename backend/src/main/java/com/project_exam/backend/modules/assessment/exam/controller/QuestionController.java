package com.project_exam.backend.modules.assessment.exam.controller;

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

    @GetMapping
    public ResponseEntity<List<QuestionAdminResponse>> getAllQuestions() {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        return ResponseEntity.ok(questionService.findAllAdminSummaries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionAdminResponse> getQuestionById(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        QuestionAdminResponse response = questionService.getQuestionDetailAdmin(id, userId);
        return ResponseEntity.ok(response);
    }

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
            return ResponseEntity.ok(questionService.getAdminBankQuestionsByPart(examPartId));
        }
        String userId = authUtils.getUserId(request);
        List<QuestionResponse> questions = questionService.getQuestionsByPart(examPartId, classId, chapterId, userId);
        return ResponseEntity.ok(questions);
    }

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
            return ResponseEntity.ok(questionService.countAdminBankQuestionsByPart(examPartId));
        }
        String userId = authUtils.getUserId(request);
        long count = questionService.countByExamPartId(examPartId, classId, chapterId, userId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/bank/my-class")
    public ResponseEntity<List<QuestionResponse>> getBankQuestionsByCurrentUserClass(
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String chapterId,
            HttpServletRequest request
    ) {
        String userId = authUtils.getUserId(request);
        List<QuestionResponse> questions = questionService.getBankQuestionsByCurrentUserClass(classId, chapterId, userId);
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/bank/my-class/count")
    public ResponseEntity<Long> countBankQuestionsByCurrentUserClass(
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String chapterId,
            HttpServletRequest request
    ) {
        String userId = authUtils.getUserId(request);
        long count = questionService.countBankQuestionsByCurrentUserClass(classId, chapterId, userId);
        return ResponseEntity.ok(count);
    }

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
        String userId = authUtils.getUserId(httpRequest);
        List<QuestionAdminResponse> responses =
                questionService.createBulkQuestionsToBankNoPassage(
                        request,
                        userId,
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
                questionService.createBulkQuestionsToBank(request, authUtils.getUserId(httpRequest), multipartRequest.getFileMap());
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @PostMapping(value = "/create-and-attach", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuestionAdminResponse> createQuestionAndAttachToTest(
            @RequestPart("request") String requestJson,
            HttpServletRequest httpRequest
    ) throws IOException {

        MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) httpRequest;
        Map<String, MultipartFile> files = multipartRequest.getFileMap();

        CreateQuestionAndAttachRequest request =
                objectMapper.readValue(requestJson, CreateQuestionAndAttachRequest.class);

        QuestionAdminResponse result =
                questionService.createQuestionAndAttachToTest(request, authUtils.getUserId(httpRequest), files);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping(value = "/create-and-attach/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<QuestionAdminResponse>> createQuestionsFromDocumentAndAttachToTest(
            @RequestPart("file") MultipartFile file,
            @RequestParam String testPartId,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String chapterId,
            HttpServletRequest httpRequest
    ) throws IOException {
        String userId = authUtils.getUserId(httpRequest);
        List<QuestionAdminResponse> responses = questionService.createQuestionsFromDocumentAndAttachToTest(
                file,
                testPartId,
                classId,
                chapterId,
                userId
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
        String userId = authUtils.getUserId(httpRequest);
        List<QuestionAdminResponse> responses = questionService.importQuestionsFromDocument(
                file,
                examPartId,
                classId,
                chapterId,
                userId
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
    public ResponseEntity<List<PassageQuestionGroupRequest>> previewPassageQuestionsFromDocument(
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        List<PassageQuestionGroupRequest> responses = questionService.previewPassageQuestionsFromDocument(file);
        return ResponseEntity.ok(responses);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<QuestionAdminResponse> updateQuestion(
            @PathVariable String id,
            @Valid @RequestBody QuestionCreateRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        QuestionAdminResponse response = questionService.updateQuestion(id, request, userId);
        return ResponseEntity.ok(response);
    }

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
                questionService.updateQuestion(id, request, authUtils.getUserId(httpRequest), files);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable String id, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        questionService.deleteById(id, userId);
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

        MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) httpRequest;

        Map<String, MultipartFile> files = multipartRequest.getFileMap();

        BulkPassageGroupRequest request =
                objectMapper.readValue(requestJson, BulkPassageGroupRequest.class);

        List<QuestionAdminResponse> result =
                questionService.createBulkGroups(request, authUtils.getUserId(httpRequest), files);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

}
