package com.project_exam.backend.modules.classroom.controller;

import com.project_exam.backend.modules.classroom.dto.ChapterRequest;
import com.project_exam.backend.modules.classroom.dto.ChapterResponse;
import com.project_exam.backend.modules.classroom.service.ChapterService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chapters")
@RequiredArgsConstructor
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
    public ResponseEntity<List<ChapterResponse>> getAll(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(chapterService.getAll(httpRequest));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ChapterResponse>> getByClass(
            @PathVariable String classId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(chapterService.getByClassId(classId, httpRequest));
    }

    @GetMapping("/{chapterId}")
    public ResponseEntity<ChapterResponse> getById(
            @PathVariable String chapterId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(chapterService.getById(chapterId, httpRequest));
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
