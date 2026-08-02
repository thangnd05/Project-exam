package com.project_exam.backend.modules.classroom.clazz.controller;

import com.project_exam.backend.modules.classroom.clazz.dto.ClassRequest;
import com.project_exam.backend.modules.classroom.clazz.dto.ClassResponse;
import com.project_exam.backend.modules.classroom.clazz.dto.ClassSimpleResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.classroom.clazz.service.ClassService;
import com.project_exam.backend.modules.assessment.test.service.TestService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {

    private final ClassService classService;
    private final TestService testService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<ClassResponse> createClass(
            @Valid @RequestBody ClassRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        ClassResponse created = classService.createClass(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ClassSimpleResponse>> getMyClasses(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        List<ClassSimpleResponse> responses = classService.getMyClasses(userId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{classId}")
    public ResponseEntity<ClassResponse> updateClass(
            @PathVariable String classId,
            @Valid @RequestBody ClassRequest request,
            HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        ClassResponse result = classService.updateClass(classId, request, userId);
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
    public ResponseEntity<Void> deleteClass(@PathVariable String classId, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        classService.deleteClass(classId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{classId}/chapters/{chapterId}/tests")
    public ResponseEntity<List<TestResponse>> getTestsByClassAndChapter(
            @PathVariable String classId,
            @PathVariable String chapterId,
            HttpServletRequest request) {
        String userId = authUtils.getUserId(request);
        List<TestResponse> responses = testService.getTestByClassIdAndChapterId(classId, chapterId, userId);
        return ResponseEntity.ok(responses);
    }
}
