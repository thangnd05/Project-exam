package com.project_exam.backend.controllers;

import com.project_exam.backend.dto.request.ClassRequest;
import com.project_exam.backend.dto.response.ClassResponse;
import com.project_exam.backend.dto.response.ClassSimpleResponse;
import com.project_exam.backend.dto.response.user.TestResponse;
import com.project_exam.backend.services.ClassService;
import com.project_exam.backend.services.ExamAndTest.TestService;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.util.Map;

@RestController
@RequestMapping("/api/classes")
@AllArgsConstructor
public class ClassController {

    private final ClassService classService;
    private final TestService testService;
    private final AuthUtils authUtils;

    @PostMapping
    public ResponseEntity<?> createClass(@RequestBody ClassRequest request, HttpServletRequest httpRequest) {
        try {
            ClassResponse created = classService.createClass(request, httpRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyClasses(HttpServletRequest request) {
        try {
            List<ClassSimpleResponse> responses = classService.getMyClasses(request);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{classId}")
    public ResponseEntity<?> updateClass(
            @PathVariable String classId,
            @RequestBody ClassRequest request,
            HttpServletRequest httpRequest) {
        try {
            ClassResponse result = classService.updateClass(classId, request, httpRequest);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("authorized")) {
                return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<ClassResponse>> getClassesByTeacher(@PathVariable String teacherId) {
        return ResponseEntity.ok(classService.getClassesByTeacher(teacherId));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<?> getById(@PathVariable String classId) {
        try {
            return ResponseEntity.ok(classService.getById(classId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{classId}")
    public ResponseEntity<?> deleteClass(@PathVariable String classId, HttpServletRequest request) {
        try {
            String teacherId = classService.getCurrentTeacherId(request);
            ClassResponse clazz = classService.getById(classId);
            if (!clazz.getTeacherId().equals(teacherId)) {
                return ResponseEntity.status(403).body(Map.of("error", "You do not own this class"));
            }
            classService.deleteClass(classId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{classId}/chapters/{chapterId}/tests")
    public ResponseEntity<?> getTestsByClassAndChapter(
            @PathVariable String classId,
            @PathVariable String chapterId,
            HttpServletRequest request) {
        String userId = null;
        try {
            userId = authUtils.getUserId(request);
        } catch (Exception ignored) {
        }
        final String userIdFinal = userId;
        List<TestResponse> responses = testService.getTestByClassIdAndChapterId(classId, chapterId, request)
                .stream()
                .map(t -> testService.buildUserTestSummary(t, userIdFinal))
                .toList();
        if (responses.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "Không có bài test nào trong lớp này"));
        }
        return ResponseEntity.ok(responses);
    }
}
