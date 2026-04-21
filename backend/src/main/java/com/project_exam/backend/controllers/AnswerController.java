package com.project_exam.backend.controllers;

import com.project_exam.backend.models.Answer;
import com.project_exam.backend.services.ExamAndTest.AnswerService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/answers")
@AllArgsConstructor
public class AnswerController {
    private final AnswerService answerService;

    @GetMapping
    public ResponseEntity<List<Answer>> getAllAnswer() {
        return ResponseEntity.ok(answerService.findAll());
    }

    @GetMapping("/by-question/{questionId}")
    public ResponseEntity<List<Answer>> getAnswersByQuestion(@PathVariable String questionId) {
        return ResponseEntity.ok(answerService.findByQuestionId(questionId));
    }

    @PostMapping
    public ResponseEntity<Answer> createAnswer(@RequestBody Answer answer) {
        return ResponseEntity.ok(answerService.save(answer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Answer> updateAnswer(@PathVariable String id, @RequestBody Answer updatedAnswer) {
        return answerService.findById(id)
                .map(existing -> {
                    updatedAnswer.setAnswerId(id);
                    return ResponseEntity.ok(answerService.save(updatedAnswer));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnswer(@PathVariable String id) {
        return answerService.findById(id)
                .map(existing -> {
                    answerService.deleteById(id);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

}
