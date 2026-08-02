package com.project_exam.backend.modules.users.user.controller;

import com.project_exam.backend.modules.users.user.dto.UserUpsertRequest;
import com.project_exam.backend.modules.users.user.dto.ProfileOverviewResponse;
import com.project_exam.backend.modules.users.user.dto.ProfileActivityResponse;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.modules.users.user.dto.UserResponse;
import com.project_exam.backend.modules.users.user.service.UserService;
import com.project_exam.backend.shared.util.AuthUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        userService.requireAdminToManageUsers();
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
        userService.requireAdminToManageUsers();
        return ResponseEntity.ok(userService.findAllPaged(page, size, keyword, roleId, verified));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        String currentUserId = authUtils.getUserId(httpRequest);
        userService.requireSelfOrAdminForUser(id, currentUserId);
        return userService.findResponseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/info-user")
    public ResponseEntity<UserResponse> getUserInfo(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return userService.getUserCurrentResponse(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/profile-overview")
    public ResponseEntity<ProfileOverviewResponse> getMyProfileOverview(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userService.getMyProfileOverview(userId));
    }

    @GetMapping("/me/activity")
    public ResponseEntity<ProfileActivityResponse> getMyActivity(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String year,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(userService.getMyActivity(userId, month, year));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserUpsertRequest request
    ) {
        userService.requireAdminToManageUsers();
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String id,
            @RequestPart("user") String userJson,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar,
            HttpServletRequest httpRequest
    ) throws IOException {
        String currentUserId = authUtils.getUserId(httpRequest);
        userService.requireSelfOrAdminForUser(id, currentUserId);
        UserUpsertRequest request = objectMapper.readValue(userJson, UserUpsertRequest.class);
        return ResponseEntity.ok(userService.updateUser(id, request, avatar));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id, HttpServletRequest httpRequest) {
        if (userService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        String currentUserId = authUtils.getUserId(httpRequest);
        userService.deleteUser(id, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
