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

    // =================== CREATE ===================

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecoveryResourceResponse> createResource(
            @RequestPart("request") String requestJson,
            @RequestPart(value = "file", required = false) MultipartFile file,
            HttpServletRequest httpRequest
    ) throws IOException {
        authUtils.requirePermission(PermissionCatalog.RECOVERY_RESOURCE_MANAGE);
        RecoveryResourceRequest request = objectMapper.readValue(requestJson, RecoveryResourceRequest.class);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.createResource(request, file, httpRequest));
    }

    // =================== UPDATE ===================

    @PutMapping(value = "/{resourceId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecoveryResourceResponse> updateResource(
            @PathVariable String resourceId,
            @RequestPart("request") String requestJson,
            @RequestPart(value = "file", required = false) MultipartFile file,
            HttpServletRequest httpRequest
    ) throws IOException {
        authUtils.requirePermission(PermissionCatalog.RECOVERY_RESOURCE_MANAGE);
        RecoveryResourceRequest request = objectMapper.readValue(requestJson, RecoveryResourceRequest.class);
        return ResponseEntity.ok(resourceService.updateResource(resourceId, request, file, httpRequest));
    }

    @PutMapping("/{resourceId}")
    public ResponseEntity<RecoveryResourceResponse> updateResourceJson(
            @PathVariable String resourceId,
            @RequestBody RecoveryResourceRequest request,
            HttpServletRequest httpRequest
    ) throws IOException {
        authUtils.requirePermission(PermissionCatalog.RECOVERY_RESOURCE_MANAGE);
        return ResponseEntity.ok(resourceService.updateResource(resourceId, request, null, httpRequest));
    }

    // =================== DELETE ===================

    @DeleteMapping("/{resourceId}")
    public ResponseEntity<Void> deleteResource(@PathVariable String resourceId) {
        authUtils.requirePermission(PermissionCatalog.RECOVERY_RESOURCE_MANAGE);
        resourceService.deleteResource(resourceId);
        return ResponseEntity.noContent().build();
    }

    // =================== GET ===================

    @GetMapping
    public ResponseEntity<List<RecoveryResourceResponse>> getAllResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    @GetMapping("/{resourceId}")
    public ResponseEntity<RecoveryResourceResponse> getResourceById(@PathVariable String resourceId) {
        return ResponseEntity.ok(resourceService.getResourceById(resourceId));
    }

    /**
     * Tìm tài liệu theo tag (dùng cho chẩn đoán: tag yếu -> gợi ý tài liệu ôn tập).
     */
    @GetMapping("/by-tag/{tagId}")
    public ResponseEntity<List<RecoveryResourceResponse>> getResourcesByTag(@PathVariable String tagId) {
        return ResponseEntity.ok(resourceService.getResourcesByTagId(tagId));
    }

    /**
     * Tìm tài liệu match tất cả tags (query param: ?tagIds=id1,id2,id3).
     */
    @GetMapping("/by-tags")
    public ResponseEntity<List<RecoveryResourceResponse>> getResourcesByTags(
            @RequestParam List<String> tagIds
    ) {
        return ResponseEntity.ok(resourceService.getResourcesByTags(tagIds));
    }

    /**
     * Proxy xem file: fetch từ Cloudinary, trả về đúng Content-Type + inline
     * để trình duyệt mở trực tiếp (PDF render, ảnh hiện, audio/video phát).
     */
    @GetMapping("/{resourceId}/view")
    public ResponseEntity<byte[]> viewResource(@PathVariable String resourceId) throws IOException {
        RecoveryResourceResponse resource = resourceService.getResourceById(resourceId);
        String url = resource.getUrl();
        String fileName = resource.getOriginalFileName();

        // Detect content type từ tên file gốc
        String contentType = resolveContentType(fileName, url);

        // Fetch file từ Cloudinary
        try (InputStream in = URI.create(url).toURL().openStream()) {
            byte[] data = in.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(data.length);
            // inline = mở trực tiếp, không trigger download
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
