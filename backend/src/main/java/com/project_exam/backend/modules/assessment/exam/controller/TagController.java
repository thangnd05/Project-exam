package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.exam.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping("/flat/{examTypeId}")
    public ResponseEntity<List<TagResponse>> getTagsFlat(@PathVariable String examTypeId) {
        return ResponseEntity.ok(tagService.getTagsFlatByExamType(examTypeId));
    }

    @GetMapping("/question/{questionId}")
    public ResponseEntity<List<TagResponse>> getTagsByQuestion(@PathVariable String questionId) {
        return ResponseEntity.ok(tagService.getTagsByQuestionId(questionId));
    }

}
