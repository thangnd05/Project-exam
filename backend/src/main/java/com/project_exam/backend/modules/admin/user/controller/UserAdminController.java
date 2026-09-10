package com.project_exam.backend.modules.admin.user.controller;

import com.project_exam.backend.modules.users.user.dto.UserUpsertRequest;
import com.project_exam.backend.modules.users.user.dto.ProfileOverviewResponse;
import com.project_exam.backend.modules.users.user.dto.ProfileActivityResponse;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.users.user.dto.UserResponse;
import com.project_exam.backend.modules.users.user.service.UserService;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

/**
 * Mặt quản trị của users, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
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
