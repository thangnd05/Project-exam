package com.project_exam.backend.modules.assessment.exam.controller;

import com.project_exam.backend.modules.assessment.exam.dto.PassageRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.service.PassageService;
import com.project_exam.backend.shared.exception.NotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/passages")
@RequiredArgsConstructor
public class PassageController {

    private final PassageService passageService;

    @GetMapping
    public ResponseEntity<List<PassageResponse>> getAllPassages() {
        return ResponseEntity.ok(passageService.findAllResponses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PassageResponse> getPassageById(@PathVariable String id) {
        PassageResponse response = passageService.findResponseById(id)
                .orElseThrow(() -> new NotFoundException("Passage không tồn tại"));
        return ResponseEntity.ok(response);
    }

}
