package com.project_exam.backend.modules.certificate.controller;

import com.project_exam.backend.modules.certificate.dto.CertificateResponse;
import com.project_exam.backend.modules.certificate.dto.CertificateTemplateRequest;
import com.project_exam.backend.modules.certificate.dto.CertificateTemplateResponse;
import com.project_exam.backend.modules.certificate.dto.RevokeCertificateRequest;
import com.project_exam.backend.modules.certificate.service.CertificateAdminService;
import com.project_exam.backend.shared.dto.MessageResponse;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/certificates")
@RequiredArgsConstructor
public class CertificateAdminController {

    private final CertificateAdminService certificateAdminService;
    private final AuthUtils authUtils;

    // ------------------------------------------------------------------ mẫu chứng chỉ

    @GetMapping("/templates")
    public ResponseEntity<List<CertificateTemplateResponse>> findAllTemplates() {
        authUtils.requirePermission(PermissionCatalog.CERTIFICATE_MANAGE);
        return ResponseEntity.ok(certificateAdminService.findAllTemplates());
    }

    @PostMapping("/templates")
    public ResponseEntity<CertificateTemplateResponse> createTemplate(
            @Valid @RequestBody CertificateTemplateRequest request) {
        authUtils.requirePermission(PermissionCatalog.CERTIFICATE_MANAGE);
        return ResponseEntity.ok(certificateAdminService.createTemplate(request));
    }

    @PutMapping("/templates/{templateId}")
    public ResponseEntity<CertificateTemplateResponse> updateTemplate(
            @PathVariable String templateId, @Valid @RequestBody CertificateTemplateRequest request) {
        authUtils.requirePermission(PermissionCatalog.CERTIFICATE_MANAGE);
        return ResponseEntity.ok(certificateAdminService.updateTemplate(templateId, request));
    }

    @DeleteMapping("/templates/{templateId}")
    public ResponseEntity<MessageResponse> deleteTemplate(@PathVariable String templateId) {
        authUtils.requirePermission(PermissionCatalog.CERTIFICATE_MANAGE);
        certificateAdminService.deleteTemplate(templateId);
        return ResponseEntity.ok(MessageResponse.of("Đã xoá mẫu chứng chỉ"));
    }

    // ------------------------------------------------------------------ chứng chỉ đã cấp

    @GetMapping
    public ResponseEntity<PageResponse<CertificateResponse>> searchIssued(
            @RequestParam(required = false) String examTypeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        authUtils.requirePermission(PermissionCatalog.CERTIFICATE_MANAGE);
        return ResponseEntity.ok(certificateAdminService.searchIssued(examTypeId, status, keyword, page, size));
    }

    @PostMapping("/{certificateId}/revoke")
    public ResponseEntity<CertificateResponse> revoke(@PathVariable String certificateId,
                                                      @Valid @RequestBody(required = false) RevokeCertificateRequest request) {
        authUtils.requirePermission(PermissionCatalog.CERTIFICATE_MANAGE);
        String reason = request == null ? null : request.getReason();
        return ResponseEntity.ok(certificateAdminService.revoke(certificateId, reason));
    }
}
