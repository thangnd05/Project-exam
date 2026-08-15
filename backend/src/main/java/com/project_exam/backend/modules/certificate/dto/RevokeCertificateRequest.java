package com.project_exam.backend.modules.certificate.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RevokeCertificateRequest {
    @Size(max = 500)
    private String reason;
}
