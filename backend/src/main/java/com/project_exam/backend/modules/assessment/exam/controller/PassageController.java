package com.project_exam.backend.modules.assessment.exam.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.modules.assessment.exam.dto.PassageRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.service.PassageService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/passages")
@RequiredArgsConstructor
public class PassageController {

    private final PassageService passageService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<PassageResponse>> getAllPassages() {
        return ResponseEntity.ok(passageService.findAllResponses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PassageResponse> getPassageById(@PathVariable String id) {
        return passageService.findResponseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PassageResponse> createPassage(
            @Valid @RequestBody PassageRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MANAGE);
        return ResponseEntity.ok(passageService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassageResponse> updatePassage(
            @PathVariable String id,
            @Valid @RequestBody PassageRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MANAGE);
        return passageService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePassage(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MANAGE);
        if (passageService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        passageService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
