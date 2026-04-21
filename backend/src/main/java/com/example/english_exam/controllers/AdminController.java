package com.example.english_exam.controllers;

import com.example.english_exam.dto.request.ExamPartRequest;
import com.example.english_exam.dto.request.ExamTypeRequest;
import com.example.english_exam.dto.request.RoleRequest;
import com.example.english_exam.dto.response.AuditLogPageResponse;
import com.example.english_exam.dto.response.ExamPartResponse;
import com.example.english_exam.dto.response.ExamTypeResponse;
import com.example.english_exam.dto.response.RoleResponse;
import com.example.english_exam.models.User;
import com.example.english_exam.services.AuditLogService;
import com.example.english_exam.services.ExamAndTest.ExamPartService;
import com.example.english_exam.services.ExamAndTest.ExamTypeService;
import com.example.english_exam.services.RoleService;
import com.example.english_exam.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@AllArgsConstructor
public class AdminController {
    private final ExamTypeService examTypeService;
    private final ExamPartService examPartService;
    private final UserService userService;
    private final AuditLogService auditLogService;
    private final RoleService roleService;

    // ==================== EXAM TYPE CRUD ====================


    @PostMapping("/exam-types")
    public ResponseEntity<ExamTypeResponse> createExamType(@RequestBody ExamTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examTypeService.create(request));
    }

    @PutMapping("/exam-types/{id}")
    public ResponseEntity<ExamTypeResponse> updateExamType(@PathVariable Long id, @RequestBody ExamTypeRequest request) {
        try {
            return ResponseEntity.ok(examTypeService.update(id, request));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/exam-types/{id}")
    public ResponseEntity<Void> deleteExamType(@PathVariable Long id) {
        try {
            examTypeService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== EXAM PART CRUD ====================


    @PostMapping("/exam-parts")
    public ResponseEntity<ExamPartResponse> createExamPart(@RequestBody ExamPartRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examPartService.create(request));
    }

    @PutMapping("/exam-parts/{id}")
    public ResponseEntity<ExamPartResponse> updateExamPart(@PathVariable Long id, @RequestBody ExamPartRequest request) {
        try {
            return ResponseEntity.ok(examPartService.update(id, request));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/exam-parts/{id}")
    public ResponseEntity<Void> deleteExamPart(@PathVariable Long id) {
        try {
            examPartService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== USER CRUD ====================

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }


    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    @PutMapping(value = "/users/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestPart("user") String userJson,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar
    ) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        User updatedUser = mapper.readValue(userJson, User.class);
        return ResponseEntity.ok(userService.updateUser(id, updatedUser, avatar));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userService.findById(id)
                .map(existing -> {
                    userService.deleteUser(id);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== ROLE CRUD ====================

    @PostMapping("/roles")
    public ResponseEntity<RoleResponse> createRole(@RequestBody RoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(request));
    }

    @PutMapping("/roles/{id}")
    public ResponseEntity<RoleResponse> updateRole(@PathVariable Long id, @RequestBody RoleRequest request) {
        try {
            return ResponseEntity.ok(roleService.update(id, request));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        try {
            roleService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }


    // ==================== AUDIT ====================
    @GetMapping("/audits")
    public ResponseEntity<AuditLogPageResponse> getRecentAudits(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        return ResponseEntity.ok(auditLogService.getRecentLogs(userId, page, size));
    }

    @GetMapping("/login-audits")
    public ResponseEntity<AuditLogPageResponse> getLoginAudits(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        return ResponseEntity.ok(auditLogService.getLoginLogs(userId, page, size));
    }
}
