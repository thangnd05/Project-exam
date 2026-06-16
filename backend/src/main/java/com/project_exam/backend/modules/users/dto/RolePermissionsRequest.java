package com.project_exam.backend.modules.users.dto;

import lombok.Data;

import java.util.List;

/** Body cho gán permission vào role: danh sách permission code role được phép. */
@Data
public class RolePermissionsRequest {
    private List<String> codes;
}
