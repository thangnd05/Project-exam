package com.project_exam.backend.modules.vocabulary.controller;

import com.project_exam.backend.modules.vocabulary.dto.VocabularyRequest;
import com.project_exam.backend.modules.vocabulary.dto.VocabularyResponse;
import com.project_exam.backend.modules.vocabulary.service.GeminiService;
import com.project_exam.backend.modules.vocabulary.service.VocabularyService;
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

@RestController
@RequestMapping("/api/vocabularies")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyService service;
    private final GeminiService geminiService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<VocabularyResponse>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VocabularyResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<VocabularyResponse> create(@Valid @RequestBody VocabularyRequest request) {
        authUtils.requirePermission(PermissionCatalog.VOCABULARY_MANAGE);
        return ResponseEntity.ok(service.createVocabulary(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<VocabularyResponse>> createBulk(
            @RequestBody List<VocabularyRequest> requests
    ) {
        authUtils.requirePermission(PermissionCatalog.VOCABULARY_MANAGE);
        return ResponseEntity.ok(service.createVocabularies(requests));
    }

    @PostMapping("/standardize")
    public ResponseEntity<Map<String, String>> standardize(@RequestBody Map<String, String> body) {
        authUtils.requirePermission(PermissionCatalog.VOCABULARY_MANAGE);
        String rawText = body.get("rawText");
        if (rawText == null || rawText.isBlank()) {
            throw new BadRequestException("Dữ liệu thô không được để trống.");
        }

        String result = geminiService.standardizeVocabulary(rawText);
        // Loại bỏ markdown code fences nếu Gemini lỡ trả về (không bắt buộc, nhưng phòng hờ)
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

    @GetMapping("/album/{albumId}")
    public ResponseEntity<List<VocabularyResponse>> getVocabulariesByAlbumId(
            @PathVariable String albumId,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(service.findAllByAlbumId(albumId, request));
    }
}