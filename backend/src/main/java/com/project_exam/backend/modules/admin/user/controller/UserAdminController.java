package com.project_exam.backend.modules.admin.user.controller;

import com.project_exam.backend.modules.users.user.dto.UserUpsertRequest;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.users.user.dto.UserResponse;
import com.project_exam.backend.modules.users.user.service.UserService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequirePermission(PermissionCatalog.USER_MANAGE)
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserService userService;

    @GetMapping("/paged")
    public ResponseEntity<PageResponse<UserResponse>> getUsersPaged(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String roleId,
            @RequestParam(required = false) Boolean verified
    ) {
        return ResponseEntity.ok(userService.findAllPaged(page, size, keyword, roleId, verified));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserUpsertRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }
}
