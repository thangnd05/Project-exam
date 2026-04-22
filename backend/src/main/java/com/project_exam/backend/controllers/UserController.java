package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.response.ProfileOverviewResponse;
import com.project_exam.backend.dto.response.UserPageResponse;
import com.project_exam.backend.models.User;
import com.project_exam.backend.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class UserController {

    private final UserService userService;

    // Lấy danh sách user
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/paged")
    public ResponseEntity<UserPageResponse> getUsersPaged(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String roleId,
            @RequestParam(required = false) Boolean verified
    ) {
        return ResponseEntity.ok(userService.findAllPaged(page, size, keyword, roleId, verified));
    }

    // Lấy user theo id
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/info-user")
    public ResponseEntity<Optional<User>> getUserInfo(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(userService.getUserCurrent(httpRequest));
    }

    @GetMapping("/me/profile-overview")
    public ResponseEntity<ProfileOverviewResponse> getMyProfileOverview(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(userService.getMyProfileOverview(httpRequest));
    }

    // Tạo mới user
    @PostMapping
    public ResponseEntity<User> createUser(
            @RequestBody User user
    ) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    // Cập nhật user
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<User> updateUser(
            @PathVariable String id,
            @RequestPart("user") String userJson,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar
    ) throws IOException {

        ObjectMapper mapper = new ObjectMapper();
        User updatedUser = mapper.readValue(userJson, User.class);

        return ResponseEntity.ok(userService.updateUser(id, updatedUser, avatar));
    }

    // Xóa user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        return userService.findById(id)
                .map(existing -> {
                    userService.deleteUser(id);
                    return ResponseEntity.noContent().build(); // 204 No Content
                })
                .orElse(ResponseEntity.notFound().build()); // 404 Not Found
    }
}
