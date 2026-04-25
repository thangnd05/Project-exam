package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.PassageRequest;
import com.project_exam.backend.dto.response.PassageResponse;
import com.project_exam.backend.services.ExamAndTest.PassageService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/passages")
@AllArgsConstructor
public class PassageController {

    private final PassageService passageService;

    @GetMapping
    public ResponseEntity<List<PassageResponse>> getAllPassages() {
        return ResponseEntity.ok(passageService.findAllResponses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PassageResponse> getPassageById(@PathVariable String id) {
        return passageService.findResponseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PassageResponse> createPassage(@Valid @RequestBody PassageRequest request) {
        return ResponseEntity.ok(passageService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassageResponse> updatePassage(
            @PathVariable String id,
            @Valid @RequestBody PassageRequest request
    ) {
        return passageService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePassage(@PathVariable String id) {
        if (passageService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        passageService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
