package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceRequest;
import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceResponse;
import com.project_exam.backend.modules.assessment.exam.service.RecoveryResourceService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping("/api/admin/recovery-resources")
@RequiredArgsConstructor
public class RecoveryResourceAdminController {

    private final RecoveryResourceService resourceService;
    private final ObjectMapper objectMapper;
    private final AuthUtils authUtils;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecoveryResourceResponse> createResource(
            @RequestPart("request") String requestJson,
            @RequestPart(value = "file", required = false) MultipartFile file,
            HttpServletRequest httpRequest
    ) throws IOException {
        authUtils.requirePermission(PermissionCatalog.RECOVERY_RESOURCE_MANAGE);
        RecoveryResourceRequest request = objectMapper.readValue(requestJson, RecoveryResourceRequest.class);
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createResource(request, file, userId));
    }

    @PutMapping(value = "/{resourceId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecoveryResourceResponse> updateResource(
            @PathVariable String resourceId,
            @RequestPart("request") String requestJson,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        authUtils.requirePermission(PermissionCatalog.RECOVERY_RESOURCE_MANAGE);
        RecoveryResourceRequest request = objectMapper.readValue(requestJson, RecoveryResourceRequest.class);
        return ResponseEntity.ok(resourceService.updateResource(resourceId, request, file));
    }

    @PutMapping("/{resourceId}")
    public ResponseEntity<RecoveryResourceResponse> updateResourceJson(
            @PathVariable String resourceId,
            @RequestBody RecoveryResourceRequest request
    ) throws IOException {
        authUtils.requirePermission(PermissionCatalog.RECOVERY_RESOURCE_MANAGE);
        return ResponseEntity.ok(resourceService.updateResource(resourceId, request, null));
    }

    @DeleteMapping("/{resourceId}")
    public ResponseEntity<Void> deleteResource(@PathVariable String resourceId) {
        authUtils.requirePermission(PermissionCatalog.RECOVERY_RESOURCE_MANAGE);
        resourceService.deleteResource(resourceId);
        return ResponseEntity.noContent().build();
    }
}
