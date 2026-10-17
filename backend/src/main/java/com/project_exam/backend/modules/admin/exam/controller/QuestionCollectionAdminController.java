package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import com.project_exam.backend.modules.assessment.exam.service.QuestionCollectionService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequirePermission(PermissionCatalog.QUESTION_COLLECTION_MANAGE)
@RequestMapping("/api/admin/question-collections")
@RequiredArgsConstructor
public class QuestionCollectionAdminController {

    private final QuestionCollectionService collectionService;

    @PostMapping
    public ResponseEntity<QuestionCollectionResponse> create(
            @Valid @RequestBody QuestionCollectionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(collectionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionCollectionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody QuestionCollectionRequest request
    ) {
        return ResponseEntity.ok(collectionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        collectionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
