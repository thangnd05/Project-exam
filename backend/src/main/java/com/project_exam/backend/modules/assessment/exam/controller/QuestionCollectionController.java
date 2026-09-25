package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import com.project_exam.backend.modules.assessment.exam.service.QuestionCollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question-collections")
@RequiredArgsConstructor
public class QuestionCollectionController {

    private final QuestionCollectionService collectionService;

    @GetMapping
    public ResponseEntity<List<QuestionCollectionResponse>> getAll() {
        return ResponseEntity.ok(collectionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionCollectionResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(collectionService.findById(id));
    }

}
