package com.project_exam.backend.modules.notes.controller;

import com.project_exam.backend.modules.notes.dto.NoteRequest;
import com.project_exam.backend.modules.notes.dto.NoteResponse;
import com.project_exam.backend.modules.notes.service.NoteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService service;

    @GetMapping
    public ResponseEntity<List<NoteResponse>> getMyNotes(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(service.findAllForCurrentUser(httpRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteResponse> getById(@PathVariable String id, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(service.findById(id, httpRequest));
    }

    @PostMapping
    public ResponseEntity<NoteResponse> create(
            @Valid @RequestBody NoteRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, httpRequest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> update(
            @PathVariable String id,
            @Valid @RequestBody NoteRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(service.update(id, request, httpRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest httpRequest) {
        service.delete(id, httpRequest);
        return ResponseEntity.noContent().build();
    }
}
