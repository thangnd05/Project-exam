package com.project_exam.backend.modules.assessment.exam.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import com.project_exam.backend.modules.assessment.exam.service.QuestionCollectionService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question-collections")
@RequiredArgsConstructor
public class QuestionCollectionController {

    private final QuestionCollectionService collectionService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<QuestionCollectionResponse>> getAll() {
        return ResponseEntity.ok(collectionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionCollectionResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(collectionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<QuestionCollectionResponse> create(
            @Valid @RequestBody QuestionCollectionRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_COLLECTION_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(collectionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionCollectionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody QuestionCollectionRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_COLLECTION_MANAGE);
        return ResponseEntity.ok(collectionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_COLLECTION_MANAGE);
        collectionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
