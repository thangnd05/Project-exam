package com.project_exam.backend.modules.system.mail.controller;

import com.project_exam.backend.modules.system.mail.dto.EmailPreviewRequest;
import com.project_exam.backend.modules.system.mail.dto.EmailPreviewResponse;
import com.project_exam.backend.modules.system.mail.dto.EmailRecipientResponse;
import com.project_exam.backend.modules.system.mail.dto.EmailResponse;
import com.project_exam.backend.modules.system.mail.dto.EmailSaveRequest;
import com.project_exam.backend.modules.system.mail.dto.EmailSendRequest;
import com.project_exam.backend.modules.system.mail.dto.MailAudienceOptionResponse;
import com.project_exam.backend.modules.system.mail.service.EmailAdminService;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/emails")
@RequiredArgsConstructor
public class EmailAdminController {

    private final EmailAdminService emailAdminService;
    private final AuthUtils authUtils;

    /** Các mẫu email tự động (đăng ký, đổi mật khẩu...)  cố định, chỉ sửa nội dung. */
    @GetMapping("/auto")
    public ResponseEntity<List<EmailResponse>> getAutoEmails() {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        return ResponseEntity.ok(emailAdminService.findAuto());
    }

    /** Các email admin tự soạn. */
    @GetMapping("/manual")
    public ResponseEntity<PageResponse<EmailResponse>> getManualEmails(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        return ResponseEntity.ok(emailAdminService.findManual(page, size));
    }

    @GetMapping("/{emailId}/recipients")
    public ResponseEntity<PageResponse<EmailRecipientResponse>> getRecipients(
            @PathVariable String emailId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        return ResponseEntity.ok(emailAdminService.findRecipients(emailId, page, size));
    }

    /** Danh sách người dùng để giao diện chọn người nhận (kèm vai trò, cờ premium để lọc). */
    @GetMapping("/audience")
    public ResponseEntity<List<MailAudienceOptionResponse>> getAudienceOptions() {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        return ResponseEntity.ok(emailAdminService.findAudienceOptions());
    }

    @PostMapping
    public ResponseEntity<EmailResponse> createManual(@Valid @RequestBody EmailSaveRequest request,
                                                      HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(emailAdminService.createManual(request, authUtils.getUserId(httpRequest)));
    }

    @PutMapping("/{emailId}")
    public ResponseEntity<EmailResponse> update(@PathVariable String emailId,
                                                @Valid @RequestBody EmailSaveRequest request,
                                                HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        return ResponseEntity.ok(
                emailAdminService.update(emailId, request, authUtils.getUserId(httpRequest)));
    }

    @DeleteMapping("/{emailId}")
    public ResponseEntity<Void> delete(@PathVariable String emailId) {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        emailAdminService.delete(emailId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{emailId}/send")
    public ResponseEntity<EmailResponse> send(@PathVariable String emailId,
                                              @Valid @RequestBody EmailSendRequest request,
                                              HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        return ResponseEntity.ok(emailAdminService.send(
                emailId, request.getUserIds(), authUtils.getUserId(httpRequest)));
    }

    @PostMapping("/{emailId}/retry-failed")
    public ResponseEntity<EmailResponse> retryFailed(@PathVariable String emailId) {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        return ResponseEntity.ok(emailAdminService.retryFailed(emailId));
    }

    @PostMapping("/preview")
    public ResponseEntity<EmailPreviewResponse> preview(@Valid @RequestBody EmailPreviewRequest request,
                                                        HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        return ResponseEntity.ok(
                emailAdminService.preview(request, authUtils.getUserId(httpRequest)));
    }

    @PostMapping("/{emailId}/test-send")
    public ResponseEntity<Void> testSend(@PathVariable String emailId,
                                         @Valid @RequestBody EmailPreviewRequest request,
                                         HttpServletRequest httpRequest) {
        authUtils.requirePermission(PermissionCatalog.EMAIL_MANAGE);
        emailAdminService.testSend(emailId, request, authUtils.getUserId(httpRequest));
        return ResponseEntity.accepted().build();
    }
}
