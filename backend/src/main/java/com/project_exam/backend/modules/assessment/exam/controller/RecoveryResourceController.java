package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceRequest;
import com.project_exam.backend.modules.assessment.exam.dto.RecoveryResourceResponse;
import com.project_exam.backend.modules.assessment.exam.service.RecoveryResourceService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLConnection;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/recovery-resources")
@RequiredArgsConstructor
public class RecoveryResourceController {

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

    @GetMapping
    public ResponseEntity<List<RecoveryResourceResponse>> getAllResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    @GetMapping("/{resourceId}")
    public ResponseEntity<RecoveryResourceResponse> getResourceById(@PathVariable String resourceId) {
        return ResponseEntity.ok(resourceService.getResourceById(resourceId));
    }

    @GetMapping("/by-tag/{tagId}")
    public ResponseEntity<List<RecoveryResourceResponse>> getResourcesByTag(@PathVariable String tagId) {
        return ResponseEntity.ok(resourceService.getResourcesByTagId(tagId));
    }

    @GetMapping("/by-part/{examPartId}")
    public ResponseEntity<List<RecoveryResourceResponse>> getResourcesByPart(@PathVariable String examPartId) {
        return ResponseEntity.ok(resourceService.getResourcesByExamPartId(examPartId));
    }

    @GetMapping("/by-parts")
    public ResponseEntity<List<RecoveryResourceResponse>> getResourcesByParts(
            @RequestParam List<String> examPartIds
    ) {
        return ResponseEntity.ok(resourceService.getResourcesByExamPartIds(examPartIds));
    }

    @GetMapping("/by-tags")
    public ResponseEntity<List<RecoveryResourceResponse>> getResourcesByTags(
            @RequestParam List<String> tagIds
    ) {
        return ResponseEntity.ok(resourceService.getResourcesByTags(tagIds));
    }

    @GetMapping("/{resourceId}/view")
    public ResponseEntity<byte[]> viewResource(@PathVariable String resourceId) throws IOException {
        RecoveryResourceResponse resource = resourceService.getResourceById(resourceId);
        String url = resource.getUrl();
        String fileName = resource.getOriginalFileName();

        String contentType = resolveContentType(fileName, url);

        try (InputStream in = URI.create(url).toURL().openStream()) {
            byte[] data = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(data.length);

            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + (fileName != null ? fileName : "file") + "\"");

            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        }
    }

    private String resolveContentType(String fileName, String url) {
        String name = fileName != null ? fileName : url;
        if (name != null) {
            String lowerName = name.toLowerCase(Locale.ROOT);
            if (lowerName.endsWith(".md") || lowerName.endsWith(".markdown")) {
                return "text/markdown; charset=utf-8";
            }
        }

        String contentType = null;
        if (fileName != null) {
            contentType = URLConnection.guessContentTypeFromName(fileName);
        }
        if (contentType == null && url != null) {
            contentType = URLConnection.guessContentTypeFromName(url);
        }
        if (contentType == null) {
            contentType = "application/octet-stream";
        }
        return contentType;
    }

}
