package com.project_exam.backend.modules.admin.vocabulary.controller;

import com.project_exam.backend.modules.vocabulary.word.dto.VocabularyRequest;
import com.project_exam.backend.modules.vocabulary.word.dto.VocabularyResponse;
import com.project_exam.backend.modules.vocabulary.lookup.service.GeminiService;
import com.project_exam.backend.modules.vocabulary.word.service.VocabularyService;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

/**
 * Mặt quản trị của vocabularies, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/vocabularies")
@RequiredArgsConstructor
public class VocabularyAdminController {

    private final VocabularyService service;
    private final GeminiService geminiService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<VocabularyResponse> create(@Valid @RequestBody VocabularyRequest request) {
        authUtils.requirePermission(PermissionCatalog.VOCABULARY_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createVocabulary(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<VocabularyResponse>> createBulk(
            @RequestBody List<VocabularyRequest> requests
    ) {
        authUtils.requirePermission(PermissionCatalog.VOCABULARY_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createVocabularies(requests));
    }

    @PostMapping("/standardize")
    public ResponseEntity<Map<String, String>> standardize(@RequestBody Map<String, String> body) {
        authUtils.requirePermission(PermissionCatalog.VOCABULARY_MANAGE);
        String rawText = body.get("rawText");
        if (rawText == null || rawText.isBlank()) {
            throw new BadRequestException("Dữ liệu thô không được để trống.");
        }

        String result = geminiService.standardizeVocabulary(rawText);

        String cleaned = result.replaceAll("(?s)```json\\s*|```", "").trim();

        return ResponseEntity.ok(Map.of("data", cleaned));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VocabularyResponse> update(
            @PathVariable String id,
            @Valid @RequestBody VocabularyRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.VOCABULARY_MANAGE);
        return ResponseEntity.ok(service.updateVocabulary(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.VOCABULARY_MANAGE);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
