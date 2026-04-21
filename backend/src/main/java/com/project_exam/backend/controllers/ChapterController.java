package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.ChapterRequest;
import com.project_exam.backend.dto.response.ChapterResponse;
import com.project_exam.backend.services.ChapterService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chapters")
@AllArgsConstructor
public class ChapterController {

    private final ChapterService chapterService;

    @PostMapping
    public ResponseEntity<ChapterResponse> create(
            HttpServletRequest requestHttp,
            @RequestBody ChapterRequest request
    ) {
        return ResponseEntity.ok(chapterService.create(requestHttp, request));
    }

    @GetMapping
    public ResponseEntity<List<ChapterResponse>> getAll() {
        return ResponseEntity.ok(chapterService.getAll());
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ChapterResponse>> getByClass(@PathVariable String classId) {
        return ResponseEntity.ok(chapterService.getByClassId(classId));
    }

    @GetMapping("/{chapterId}")
    public ResponseEntity<ChapterResponse> getById(@PathVariable String chapterId) {
        return ResponseEntity.ok(chapterService.getById(chapterId));
    }

    @PutMapping("/{chapterId}")
    public ResponseEntity<ChapterResponse> update(
            HttpServletRequest requestHttp,
            @PathVariable String chapterId,
            @RequestBody ChapterRequest request
    ) {
        return ResponseEntity.ok(chapterService.update(requestHttp, chapterId, request));
    }

    @DeleteMapping("/{chapterId}")
    public ResponseEntity<Void> delete(
            HttpServletRequest requestHttp,
            @PathVariable String chapterId
    ) {
        chapterService.delete(requestHttp, chapterId);
        return ResponseEntity.noContent().build();
    }

}
