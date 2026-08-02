package com.project_exam.backend.modules.assessment.exam.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.modules.assessment.exam.dto.PassageRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.service.PassageService;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
        PassageResponse response = passageService.findResponseById(id)
                .orElseThrow(() -> new NotFoundException("Passage không tồn tại"));
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<PassageResponse> createPassage(
            @Valid @RequestBody PassageRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(passageService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassageResponse> updatePassage(
            @PathVariable String id,
            @Valid @RequestBody PassageRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MANAGE);
        PassageResponse response = passageService.update(id, request)
                .orElseThrow(() -> new NotFoundException("Passage không tồn tại"));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePassage(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MANAGE);
        if (passageService.findById(id).isEmpty()) {
            throw new NotFoundException("Passage không tồn tại");
        }
        passageService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
