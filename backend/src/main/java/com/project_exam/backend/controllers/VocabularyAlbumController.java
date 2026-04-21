package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.VocabularyAlbumRequest;
import com.project_exam.backend.dto.response.VocabularyAlbumResponse;
import com.project_exam.backend.services.LearningVoca.VocabularyAlbumService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
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