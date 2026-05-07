package com.project_exam.backend.modules.users.controller;

import com.project_exam.backend.modules.users.dto.UserUpsertRequest;
import com.project_exam.backend.modules.users.dto.ProfileOverviewResponse;
import com.project_exam.backend.modules.users.dto.UserPageResponse;
import com.project_exam.backend.modules.users.dto.UserResponse;
import com.project_exam.backend.modules.users.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class UserController {

    private final UserService userService;

    // Lấy danh sách user (admin only)
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(HttpServletRequest httpRequest) {
        userService.requireAdminToManageUsers(httpRequest);
        return ResponseEntity.ok(userService.findAllResponses());
    }

    @GetMapping("/paged")
    public ResponseEntity<UserPageResponse> getUsersPaged(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String roleId,
            @RequestParam(required = false) Boolean verified,
            HttpServletRequest httpRequest
    ) {
        userService.requireAdminToManageUsers(httpRequest);
        return ResponseEntity.ok(userService.findAllPaged(page, size, keyword, roleId, verified));
    }

    // Lấy user theo id
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        return userService.findResponseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/info-user")
    public ResponseEntity<UserResponse> getUserInfo(HttpServletRequest httpRequest) {
        return userService.getUserCurrentResponse(httpRequest)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/profile-overview")
    public ResponseEntity<ProfileOverviewResponse> getMyProfileOverview(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(userService.getMyProfileOverview(httpRequest));
    }

    // Tạo mới user (admin only — đăng ký thường đi qua /api/auth/register)
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserUpsertRequest request,
            HttpServletRequest httpRequest
    ) {
        userService.requireAdminToManageUsers(httpRequest);
        return ResponseEntity.ok(userService.createUser(request));
    }

    // Cập nhật user (chính chủ hoặc admin)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String id,
            @RequestPart("user") String userJson,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar,
            HttpServletRequest httpRequest
    ) throws IOException {
        userService.requireSelfOrAdminForUser(id, httpRequest);
        ObjectMapper mapper = new ObjectMapper();
        UserUpsertRequest request = mapper.readValue(userJson, UserUpsertRequest.class);
        return ResponseEntity.ok(userService.updateUser(id, request, avatar));
    }

    // Xóa user (chính chủ hoặc admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id, HttpServletRequest httpRequest) {
        if (userService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteUser(id, httpRequest);
        return ResponseEntity.noContent().build();
    }
}
