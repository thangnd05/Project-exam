package com.project_exam.backend.modules.vocabulary.learning.controller;

import com.project_exam.backend.modules.vocabulary.learning.dto.UserVocabularyRequest;
import com.project_exam.backend.modules.vocabulary.learning.dto.UserVocabularyResponse;
import com.project_exam.backend.modules.vocabulary.learning.service.UserVocabularyService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-vocabulary")
@RequiredArgsConstructor
public class UserVocabularyController {

    private final UserVocabularyService service;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<UserVocabularyResponse>> getAll(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(service.findAllForCurrentUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserVocabularyResponse> getById(@PathVariable String id, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(service.findById(id, userId));
    }

    @PostMapping
    public ResponseEntity<UserVocabularyResponse> create(
            @Valid @RequestBody UserVocabularyRequest request,
            HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        UserVocabularyResponse created = service.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserVocabularyResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UserVocabularyRequest request,
            HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(service.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        service.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<String> deleteAll(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        service.deleteAllForCurrentUser(userId);
        return ResponseEntity.ok("Đã xóa toàn bộ từ vựng của bạn!");
    }
}
