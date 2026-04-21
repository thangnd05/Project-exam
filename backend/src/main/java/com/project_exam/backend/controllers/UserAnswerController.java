package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.UserAnswerRequest;
import com.project_exam.backend.dto.response.ResultSummaryDto;
import com.project_exam.backend.models.UserAnswer;
import com.project_exam.backend.services.ExamAndTest.AnswerService;
import com.project_exam.backend.services.ExamAndTest.UserAnswerService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-answers")
@AllArgsConstructor
public class UserAnswerController {

    private final UserAnswerService userAnswerService;
    private final AnswerService answerService;

    @GetMapping
    public ResponseEntity<List<UserAnswer>> getAll() {
        return ResponseEntity.ok(userAnswerService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserAnswer> getById(@PathVariable String id) {
        return userAnswerService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user-test/{userTestId}")
    public ResponseEntity<List<UserAnswer>> getByUserTest(@PathVariable String userTestId) {
        return ResponseEntity.ok(userAnswerService.findByUserTestId(userTestId));
    }

    @GetMapping("/question/{questionId}")
    public ResponseEntity<List<UserAnswer>> getByQuestion(@PathVariable String questionId) {
        return ResponseEntity.ok(userAnswerService.findByQuestionId(questionId));
    }

    @PostMapping
    public ResponseEntity<UserAnswer> create(@RequestBody UserAnswer userAnswer) {
        return ResponseEntity.ok(userAnswerService.save(userAnswer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAnswer> update(@PathVariable String id, @RequestBody UserAnswer userAnswer) {
        userAnswer.setUserAnswerId(id);
        return ResponseEntity.ok(userAnswerService.save(userAnswer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return userAnswerService.findById(id)
                .map(existing -> {
                    userAnswerService.delete(id);
                    return ResponseEntity.noContent().build(); // 204 No Content
                })
                .orElse(ResponseEntity.notFound().build()); // 404 Not Found
    }

    @PostMapping("/batch")
    public ResponseEntity<?> saveUserAnswers(@RequestBody List<UserAnswerRequest> requests) {
        for (UserAnswerRequest a : requests) {
            UserAnswer ua = new UserAnswer();
            ua.setUserTestId(a.getUserTestId());
            ua.setQuestionId(a.getQuestionId());
            ua.setSelectedAnswerId(a.getSelectedAnswerId());
            ua.setAnswerText(a.getAnswerText());

            userAnswerService.save(ua);
        }

        return ResponseEntity.ok("Saved all answers!");
    }

    @GetMapping("/user-test/{userTestId}/result")
    public ResponseEntity<ResultSummaryDto> getResult(@PathVariable String userTestId) {
        // ✅ Chỉ cần gọi phương thức service và trả về kết quả
        ResultSummaryDto result = userAnswerService.getResultSummary(userTestId);
        return ResponseEntity.ok(result);
    }

}
