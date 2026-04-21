package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.PracticeCheckRequest;
import com.project_exam.backend.dto.response.PracticeCheckResponse;
import com.project_exam.backend.dto.response.PracticeQuestionResponse;
import com.project_exam.backend.services.LearningVoca.PracticeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/practice-questions")
@AllArgsConstructor
public class PracticeController {

    private final PracticeService practiceService;

    @GetMapping("/generate/{albumId}")
    public ResponseEntity<PracticeQuestionResponse> generate(HttpServletRequest request, @PathVariable String albumId) {
        return practiceService.generateOneRandomQuestion(request, albumId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/mark-known/{vocabId}")
    public ResponseEntity<String> markWordKnown(@PathVariable String vocabId, HttpServletRequest httpRequest) {
        practiceService.markWordAsKnown(httpRequest, vocabId);
        return ResponseEntity.ok("Đã đánh dấu từ này là đã biết");
    }

    @PostMapping("/check")
    public ResponseEntity<PracticeCheckResponse> check(HttpServletRequest request, @RequestBody PracticeCheckRequest req) {
        return ResponseEntity.ok(practiceService.checkAnswer(request, req));
    }
}

