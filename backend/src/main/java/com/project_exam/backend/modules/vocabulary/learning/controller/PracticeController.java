package com.project_exam.backend.modules.vocabulary.learning.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.PracticeCheckRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.PracticeCheckResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.PracticeQuestionResponse;
import com.project_exam.backend.modules.vocabulary.learning.service.PracticeService;
import com.project_exam.backend.shared.dto.MessageResponse;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/practice-questions")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeService practiceService;
    private final AuthUtils authUtils;

    @GetMapping("/generate/{albumId}")
    public ResponseEntity<PracticeQuestionResponse> generate(HttpServletRequest httpRequest, @PathVariable String albumId) {
        String userId = authUtils.getUserId(httpRequest);
        return practiceService.generateOneRandomQuestion(userId, albumId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/mark-known/{vocabId}")
    public ResponseEntity<MessageResponse> markWordKnown(@PathVariable String vocabId, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        practiceService.markWordAsKnown(userId, vocabId);
        return ResponseEntity.ok(MessageResponse.of("Đã đánh dấu từ này là đã biết"));
    }

    @PostMapping("/check")
    public ResponseEntity<PracticeCheckResponse> check(HttpServletRequest httpRequest, @RequestBody PracticeCheckRequest req) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(practiceService.checkAnswer(userId, req));
    }
}
