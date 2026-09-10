package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import com.project_exam.backend.modules.assessment.exam.service.QuestionCollectionService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Mặt quản trị của question-collections, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/question-collections")
@RequiredArgsConstructor
public class QuestionCollectionAdminController {

    private final QuestionCollectionService collectionService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<QuestionCollectionResponse> create(
            @Valid @RequestBody QuestionCollectionRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_COLLECTION_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(collectionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionCollectionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody QuestionCollectionRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_COLLECTION_MANAGE);
        return ResponseEntity.ok(collectionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_COLLECTION_MANAGE);
        collectionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
