package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.PassageMediaResponse;
import com.project_exam.backend.modules.assessment.exam.service.PassageMediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/passage-media")
@RequiredArgsConstructor
public class PassageMediaController {

    private final PassageMediaService service;

    @GetMapping("/{id}")
    public ResponseEntity<PassageMediaResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-passage/{passageId}")
    public ResponseEntity<List<PassageMediaResponse>> getByPassage(
            @PathVariable String passageId) {
        return ResponseEntity.ok(service.getByPassageId(passageId));
    }

}
