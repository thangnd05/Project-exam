package com.project_exam.backend.modules.system.mail.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class EmailSendRequest {

    @NotEmpty(message = "Phải chọn ít nhất một người nhận")
    private List<String> userIds;
}
