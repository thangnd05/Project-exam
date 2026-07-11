package com.project_exam.backend.modules.vocabulary.learning.controller;

import com.project_exam.backend.modules.vocabulary.learning.dto.UserVocabularyRequest;
import com.project_exam.backend.modules.vocabulary.learning.dto.UserVocabularyResponse;
import com.project_exam.backend.modules.vocabulary.learning.service.UserVocabularyService;
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

    @GetMapping
    public ResponseEntity<List<UserVocabularyResponse>> getAll(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(service.findAllForCurrentUser(httpRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserVocabularyResponse> getById(@PathVariable String id, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(service.findById(id, httpRequest));
    }

    @PostMapping
    public ResponseEntity<UserVocabularyResponse> create(
            @Valid @RequestBody UserVocabularyRequest request,
            HttpServletRequest httpRequest) {
        UserVocabularyResponse created = service.create(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserVocabularyResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UserVocabularyRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(service.update(id, request, httpRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        service.delete(id, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<String> deleteAll(HttpServletRequest httpRequest) {
        service.deleteAllForCurrentUser(httpRequest);
        return ResponseEntity.ok("Đã xóa toàn bộ từ vựng của bạn!");
    }
}
