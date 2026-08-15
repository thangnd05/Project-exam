package com.project_exam.backend.modules.certificate.controller;

import com.project_exam.backend.modules.certificate.dto.AttemptCertificateResponse;
import com.project_exam.backend.modules.certificate.dto.CertificateResponse;
import com.project_exam.backend.modules.certificate.dto.CertificateVerifyResponse;
import com.project_exam.backend.modules.certificate.service.CertificateService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final AuthUtils authUtils;

    @GetMapping("/me")
    public ResponseEntity<List<CertificateResponse>> findMine(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(certificateService.findMine(userId));
    }

    /** Tra cứu công khai, không cần đăng nhập. */
    @GetMapping("/verify/{code}")
    public ResponseEntity<CertificateVerifyResponse> verify(@PathVariable String code) {
        return ResponseEntity.ok(certificateService.verify(code));
    }

    @GetMapping("/by-attempt/{userTestId}")
    public ResponseEntity<AttemptCertificateResponse> getForAttempt(@PathVariable String userTestId,
                                                                    HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(certificateService.getForAttempt(userTestId, userId));
    }

    @GetMapping("/{certificateId}")
    public ResponseEntity<CertificateResponse> findOne(@PathVariable String certificateId,
                                                       HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(certificateService.findOwned(certificateId, userId));
    }
}
