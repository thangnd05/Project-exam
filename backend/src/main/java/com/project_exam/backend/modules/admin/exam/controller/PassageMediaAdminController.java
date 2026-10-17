package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.service.PassageMediaService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequirePermission(PermissionCatalog.PASSAGE_MEDIA_MANAGE)
@RequestMapping("/api/admin/passage-media")
@RequiredArgsConstructor
public class PassageMediaAdminController {

    private final PassageMediaService service;

    @PostMapping
    public ResponseEntity<PassageMediaResponse> create(@RequestBody PassageMediaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassageMediaResponse> update(
            @PathVariable String id,
            @RequestBody PassageMediaRequest request
    ) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
