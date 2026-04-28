package com.project_exam.backend.modules.classroom.controller;

import com.project_exam.backend.modules.classroom.dto.ClassRequest;
import com.project_exam.backend.modules.classroom.dto.ClassResponse;
import com.project_exam.backend.modules.classroom.dto.ClassSimpleResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.classroom.service.ClassService;
import com.project_exam.backend.modules.assessment.test.service.TestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@AllArgsConstructor
public class ClassController {

    private final ClassService classService;
    private final TestService testService;

    @PostMapping
    public ResponseEntity<ClassResponse> createClass(
            @Valid @RequestBody ClassRequest request,
            HttpServletRequest httpRequest
    ) {
        ClassResponse created = classService.createClass(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ClassSimpleResponse>> getMyClasses(HttpServletRequest request) {
        List<ClassSimpleResponse> responses = classService.getMyClasses(request);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{classId}")
    public ResponseEntity<ClassResponse> updateClass(
            @PathVariable String classId,
            @Valid @RequestBody ClassRequest request,
            HttpServletRequest httpRequest) {
        ClassResponse result = classService.updateClass(classId, request, httpRequest);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<ClassResponse>> getClassesByTeacher(@PathVariable String teacherId) {
        return ResponseEntity.ok(classService.getClassesByTeacher(teacherId));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ClassResponse> getById(@PathVariable String classId) {
        return ResponseEntity.ok(classService.getById(classId));
    }

    @DeleteMapping("/{classId}")
    public ResponseEntity<Void> deleteClass(@PathVariable String classId, HttpServletRequest request) {
        String teacherId = classService.getCurrentTeacherId(request);
        ClassResponse clazz = classService.getById(classId);
        if (!clazz.getTeacherId().equals(teacherId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        classService.deleteClass(classId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{classId}/chapters/{chapterId}/tests")
    public ResponseEntity<List<TestResponse>> getTestsByClassAndChapter(
            @PathVariable String classId,
            @PathVariable String chapterId,
            HttpServletRequest request) {
        List<TestResponse> responses = testService.getTestByClassIdAndChapterId(classId, chapterId, request);
        return ResponseEntity.ok(responses);
    }
}
