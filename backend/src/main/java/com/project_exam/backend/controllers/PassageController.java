package com.project_exam.backend.controllers;

import com.project_exam.backend.models.Passage;
import com.project_exam.backend.services.ExamAndTest.PassageService;
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
    public ResponseEntity<List<Passage>> getAllPassages() {
        return ResponseEntity.ok(passageService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Passage> getPassageById(@PathVariable String id) {
        return passageService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Passage> createPassage(@RequestBody Passage passage) {
        return ResponseEntity.ok(passageService.save(passage));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Passage> updatePassage(@PathVariable String id, @RequestBody Passage updatedPassage) {
        return passageService.findById(id)
                .map(existing -> {
                    updatedPassage.setPassageId(id);
                    return ResponseEntity.ok(passageService.save(updatedPassage));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePassage(@PathVariable String id) {
        return passageService.findById(id)
                .map(existing -> {
                    passageService.deleteById(id);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
