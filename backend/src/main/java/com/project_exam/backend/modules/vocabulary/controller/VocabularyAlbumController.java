package com.project_exam.backend.modules.vocabulary.controller;

import com.project_exam.backend.modules.vocabulary.dto.VocabularyAlbumRequest;
import com.project_exam.backend.modules.vocabulary.dto.VocabularyAlbumResponse;
import com.project_exam.backend.modules.vocabulary.service.VocabularyAlbumService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/vocabulary-albums")
public class VocabularyAlbumController {

    private final VocabularyAlbumService service;

    @GetMapping
    public ResponseEntity<List<VocabularyAlbumResponse>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VocabularyAlbumResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<VocabularyAlbumResponse> create(
            @RequestBody VocabularyAlbumRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(service.create(request, httpRequest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VocabularyAlbumResponse> update(
            @PathVariable String id,
            @RequestBody VocabularyAlbumRequest request
    ) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-albums")
    public ResponseEntity<List<VocabularyAlbumResponse>> getMyAlbums(HttpServletRequest request) {
        return ResponseEntity.ok(service.findAllByUserId(request));
    }
}