package com.project_exam.backend.modules.vocabulary.word.controller;

import com.project_exam.backend.modules.vocabulary.word.dto.VocabularyRequest;
import com.project_exam.backend.modules.vocabulary.word.dto.VocabularyResponse;
import com.project_exam.backend.modules.vocabulary.lookup.service.GeminiService;
import com.project_exam.backend.modules.vocabulary.word.service.VocabularyService;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

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

    @GetMapping("/album/{albumId}")
    public ResponseEntity<List<VocabularyResponse>> getVocabulariesByAlbumId(
            @PathVariable String albumId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(service.findAllByAlbumId(albumId, userId));
    }
}
