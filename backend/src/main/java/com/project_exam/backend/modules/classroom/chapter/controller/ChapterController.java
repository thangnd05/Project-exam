package com.project_exam.backend.modules.classroom.chapter.controller;

import com.project_exam.backend.modules.classroom.chapter.dto.ChapterRequest;
import com.project_exam.backend.modules.classroom.chapter.dto.ChapterResponse;
import com.project_exam.backend.modules.classroom.chapter.service.ChapterService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/chapters")
@RequiredArgsConstructor
public class ChapterController {

    private final ChapterService chapterService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<ChapterResponse> create(
            HttpServletRequest httpRequest,
            @RequestBody ChapterRequest request
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(chapterService.create(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<ChapterResponse>> getAll() {
        return ResponseEntity.ok(chapterService.getAll());
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ChapterResponse>> getByClass(
            @PathVariable String classId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(chapterService.getByClassId(classId, userId));
    }

    @GetMapping("/{chapterId}")
    public ResponseEntity<ChapterResponse> getById(
            @PathVariable String chapterId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(chapterService.getById(chapterId, userId));
    }

    @PutMapping("/{chapterId}")
    public ResponseEntity<ChapterResponse> update(
            HttpServletRequest httpRequest,
            @PathVariable String chapterId,
            @RequestBody ChapterRequest request
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(chapterService.update(userId, chapterId, request));
    }

    @DeleteMapping("/{chapterId}")
    public ResponseEntity<Void> delete(
            HttpServletRequest httpRequest,
            @PathVariable String chapterId
    ) {
        String userId = authUtils.getUserId(httpRequest);
        chapterService.delete(userId, chapterId);
        return ResponseEntity.noContent().build();
    }

}
