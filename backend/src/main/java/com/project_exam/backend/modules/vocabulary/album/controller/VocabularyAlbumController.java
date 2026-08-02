package com.project_exam.backend.modules.vocabulary.album.controller;

import com.project_exam.backend.modules.vocabulary.album.dto.VocabularyAlbumRequest;
import com.project_exam.backend.modules.vocabulary.album.dto.VocabularyAlbumResponse;
import com.project_exam.backend.modules.vocabulary.album.service.VocabularyAlbumService;
import com.project_exam.backend.shared.util.AuthUtils;
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
    private final AuthUtils authUtils;

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
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(service.create(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VocabularyAlbumResponse> update(
            @PathVariable String id,
            @RequestBody VocabularyAlbumRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(service.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        service.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-albums")
    public ResponseEntity<List<VocabularyAlbumResponse>> getMyAlbums(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(service.findAllByUserId(userId));
    }
}
