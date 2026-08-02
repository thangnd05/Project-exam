package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.service.PassageMediaService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/passage-media")
@RequiredArgsConstructor
public class PassageMediaController {

    private final PassageMediaService service;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<PassageMediaResponse> create(@RequestBody PassageMediaRequest request) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MEDIA_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PassageMediaResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-passage/{passageId}")
    public ResponseEntity<List<PassageMediaResponse>> getByPassage(
            @PathVariable String passageId) {
        return ResponseEntity.ok(service.getByPassageId(passageId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassageMediaResponse> update(
            @PathVariable String id,
            @RequestBody PassageMediaRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MEDIA_MANAGE);
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MEDIA_MANAGE);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
