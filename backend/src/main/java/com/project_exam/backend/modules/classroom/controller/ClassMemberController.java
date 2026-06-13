package com.project_exam.backend.modules.classroom.controller;

import com.project_exam.backend.modules.classroom.dto.ClassMemberActionRequest;
import com.project_exam.backend.modules.classroom.dto.ClassMemberJoinRequest;
import com.project_exam.backend.modules.classroom.dto.ClassMemberResponse;
import com.project_exam.backend.modules.classroom.service.ClassMemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.util.Map;

@RestController
@RequestMapping("/api/class-members")
@RequiredArgsConstructor
public class ClassMemberController {

    private final ClassMemberService classMemberService;

    @PostMapping("/join")
    public ResponseEntity<ClassMemberResponse> joinClass(
            @Valid @RequestBody ClassMemberJoinRequest body,
            HttpServletRequest request
    ) {
        String classQr = body.getClassQr();
        if (classQr == null || classQr.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        ClassMemberResponse member = classMemberService.joinClassByQr(classQr.trim(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    @DeleteMapping("/leave")
    public ResponseEntity<Map<String, String>> leaveClass(
            @Valid @RequestBody ClassMemberJoinRequest body,
            HttpServletRequest request
    ) {
        String classId = body.getClassId();
        if (classId == null) {
            return ResponseEntity.badRequest().build();
        }
        classMemberService.leaveClass(classId, request);
        return ResponseEntity.ok(Map.of("message", "You have left the class successfully"));
    }

    @PutMapping("/approve")
    public ResponseEntity<Map<String, String>> approveSingle(
            @Valid @RequestBody ClassMemberActionRequest body,
            HttpServletRequest request
    ) {
        String classId = body.getClassId();
        String userId = body.getUserId();
        if (classId == null || userId == null) {
            return ResponseEntity.badRequest().build();
        }
        classMemberService.approveSingle(classId, userId, request);
        return ResponseEntity.ok(Map.of("message", "Member approved successfully"));
    }

    @PutMapping("/approve-all/{classId}")
    public ResponseEntity<Map<String, String>> approveAll(@PathVariable String classId, HttpServletRequest request) {
        int count = classMemberService.approveAll(classId, request);
        return ResponseEntity.ok(Map.of("message", "Approved " + count + " pending members"));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ClassMemberResponse>> getAllMembers(@PathVariable String classId) {
        return ResponseEntity.ok(classMemberService.getAllMembers(classId));
    }

    @GetMapping("/class/{classId}/pending")
    public ResponseEntity<List<ClassMemberResponse>> getPendingMembers(@PathVariable String classId) {
        return ResponseEntity.ok(classMemberService.getPendingMembers(classId));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Map<String, String>> removeMember(
            @Valid @RequestBody ClassMemberActionRequest body,
            HttpServletRequest request
    ) {
        String classId = body.getClassId();
        String userId = body.getUserId();
        if (classId == null || userId == null) {
            return ResponseEntity.badRequest().build();
        }
        classMemberService.removeMember(classId, userId, request);
        return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
    }

    @GetMapping("/my-classes")
    public ResponseEntity<Map<String, Object>> getMyClasses(HttpServletRequest request) {
        Map<String, Object> myClasses = classMemberService.getClassesOfCurrentStudent(request);
        return ResponseEntity.ok(myClasses);
    }
}
