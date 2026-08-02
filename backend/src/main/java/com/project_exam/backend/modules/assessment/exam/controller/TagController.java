package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.TagRequest;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.exam.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @PostMapping
    public ResponseEntity<TagResponse> createTag(@RequestBody TagRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tagService.createTag(request));
    }

    @PutMapping("/{tagId}")
    public ResponseEntity<TagResponse> updateTag(
            @PathVariable String tagId,
            @RequestBody TagRequest request
    ) {
        return ResponseEntity.ok(tagService.updateTag(tagId, request));
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(@PathVariable String tagId) {
        tagService.deleteTag(tagId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tree/{examTypeId}")
    public ResponseEntity<List<TagResponse>> getTagTree(@PathVariable String examTypeId) {
        return ResponseEntity.ok(tagService.getTagTreeByExamType(examTypeId));
    }

    @GetMapping("/flat/{examTypeId}")
    public ResponseEntity<List<TagResponse>> getTagsFlat(@PathVariable String examTypeId) {
        return ResponseEntity.ok(tagService.getTagsFlatByExamType(examTypeId));
    }

    @GetMapping("/question/{questionId}")
    public ResponseEntity<List<TagResponse>> getTagsByQuestion(@PathVariable String questionId) {
        return ResponseEntity.ok(tagService.getTagsByQuestionId(questionId));
    }

}
