package com.project_exam.backend.modules.admin.user.controller;

import com.project_exam.backend.modules.users.user.dto.UserUpsertRequest;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.users.user.dto.UserResponse;
import com.project_exam.backend.modules.users.user.service.UserService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserService userService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        authUtils.requirePermission(PermissionCatalog.USER_MANAGE);
        return ResponseEntity.ok(userService.findAllResponses());
    }

    @GetMapping("/paged")
    public ResponseEntity<PageResponse<UserResponse>> getUsersPaged(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String roleId,
            @RequestParam(required = false) Boolean verified
    ) {
        authUtils.requirePermission(PermissionCatalog.USER_MANAGE);
        return ResponseEntity.ok(userService.findAllPaged(page, size, keyword, roleId, verified));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserUpsertRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.USER_MANAGE);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }
}
