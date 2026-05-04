package com.project_exam.backend.modules.vocabulary.controller;

import com.project_exam.backend.modules.vocabulary.dto.VocabularyRequest;
import com.project_exam.backend.modules.vocabulary.dto.VocabularyResponse;
import com.project_exam.backend.modules.vocabulary.repository.VocabularyAlbumRepository;
import com.project_exam.backend.modules.vocabulary.service.VocabularyService;
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

    @PostMapping("/bulk")
    public ResponseEntity<List<VocabularyResponse>> createBulk(@RequestBody List<VocabularyRequest> requests) {
        return ResponseEntity.ok(service.createVocabularies(requests));
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
