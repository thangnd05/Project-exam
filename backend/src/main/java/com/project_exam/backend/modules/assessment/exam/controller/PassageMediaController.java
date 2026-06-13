package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.service.PassageMediaService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * PassageMedia được student xem trong khi làm bài (GET ổn). CUD admin-only;
 * flow upload media kèm question đi qua {@code QuestionService} (đã có ownership check).
 */
@RestController
@RequestMapping("/api/passage-media")
@RequiredArgsConstructor
public class PassageMediaController {

    private final PassageMediaService service;
    private final AuthUtils authUtils;

    // CREATE
    @PostMapping
    public ResponseEntity<PassageMediaResponse> create(
            @RequestBody PassageMediaRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(service.create(request));
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<PassageMediaResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // GET BY PASSAGE
    @GetMapping("/by-passage/{passageId}")
    public ResponseEntity<List<PassageMediaResponse>> getByPassage(
            @PathVariable String passageId) {
        return ResponseEntity.ok(service.getByPassageId(passageId));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<PassageMediaResponse> update(
            @PathVariable String id,
            @RequestBody PassageMediaRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(service.update(id, request));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        authUtils.requireAdmin(httpRequest);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
