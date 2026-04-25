package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.VocabularyRequest;
import com.project_exam.backend.dto.response.VocabularyResponse;
import com.project_exam.backend.repositories.VocabularyAlbumRepository;
import com.project_exam.backend.services.LearningVoca.VocabularyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocabularies")
@AllArgsConstructor
public class VocabularyController {
    private final VocabularyService service;
    private final VocabularyAlbumRepository albumRepository;

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
        return ResponseEntity.ok(service.createVocabulary(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VocabularyResponse> update(
            @PathVariable String id,
            @Valid @RequestBody VocabularyRequest request
    ) {
        VocabularyResponse response = service.updateVocabulary(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
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
