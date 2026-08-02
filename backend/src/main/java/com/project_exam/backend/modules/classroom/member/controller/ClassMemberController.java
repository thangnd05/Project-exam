package com.project_exam.backend.modules.classroom.member.controller;

import com.project_exam.backend.modules.classroom.member.dto.ClassMemberActionRequest;
import com.project_exam.backend.modules.classroom.member.dto.ClassMemberJoinRequest;
import com.project_exam.backend.modules.classroom.member.dto.ClassMemberResponse;
import com.project_exam.backend.modules.classroom.member.service.ClassMemberService;
import com.project_exam.backend.shared.dto.MessageResponse;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.shared.util.ClassAccessGuard;
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
    private final ClassAccessGuard classAccessGuard;
    private final AuthUtils authUtils;

    @PostMapping("/join")
    public ResponseEntity<ClassMemberResponse> joinClass(
            @Valid @RequestBody ClassMemberJoinRequest body,
            HttpServletRequest request
    ) {
        String classQr = body.getClassQr();
        if (classQr == null || classQr.isBlank()) {
            throw new BadRequestException("Mã QR lớp không được để trống");
        }
        String userId = authUtils.getUserId(request);
        ClassMemberResponse member = classMemberService.joinClassByQr(classQr.trim(), userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    @DeleteMapping("/leave")
    public ResponseEntity<MessageResponse> leaveClass(
            @Valid @RequestBody ClassMemberJoinRequest body,
            HttpServletRequest request
    ) {
        String classId = body.getClassId();
        if (classId == null || classId.isBlank()) {
            throw new BadRequestException("classId không được để trống");
        }
        String userId = authUtils.getUserId(request);
        classMemberService.leaveClass(classId, userId);
        return ResponseEntity.ok(MessageResponse.of("Bạn đã rời lớp thành công"));
    }

    @PutMapping("/approve")
    public ResponseEntity<MessageResponse> approveSingle(
            @Valid @RequestBody ClassMemberActionRequest body,
            HttpServletRequest request
    ) {
        String classId = body.getClassId();
        String targetUserId = body.getUserId();
        if (classId == null || classId.isBlank() || targetUserId == null || targetUserId.isBlank()) {
            throw new BadRequestException("classId và userId không được để trống");
        }
        String currentUserId = authUtils.getUserId(request);
        classMemberService.approveSingle(classId, targetUserId, currentUserId);
        return ResponseEntity.ok(MessageResponse.of("Đã duyệt thành viên thành công"));
    }

    @PutMapping("/approve-all/{classId}")
    public ResponseEntity<MessageResponse> approveAll(@PathVariable String classId, HttpServletRequest request) {
        String currentUserId = authUtils.getUserId(request);
        int count = classMemberService.approveAll(classId, currentUserId);
        return ResponseEntity.ok(MessageResponse.of("Đã duyệt " + count + " thành viên đang chờ"));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ClassMemberResponse>> getAllMembers(
            @PathVariable String classId,
            HttpServletRequest request
    ) {
        classAccessGuard.requireMemberOrTeacher(classId, authUtils.getUserId(request));
        return ResponseEntity.ok(classMemberService.getAllMembers(classId));
    }

    @GetMapping("/class/{classId}/pending")
    public ResponseEntity<List<ClassMemberResponse>> getPendingMembers(
            @PathVariable String classId,
            HttpServletRequest request
    ) {
        classAccessGuard.requireTeacher(classId, authUtils.getUserId(request));
        return ResponseEntity.ok(classMemberService.getPendingMembers(classId));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<MessageResponse> removeMember(
            @Valid @RequestBody ClassMemberActionRequest body,
            HttpServletRequest request
    ) {
        String classId = body.getClassId();
        String targetUserId = body.getUserId();
        if (classId == null || classId.isBlank() || targetUserId == null || targetUserId.isBlank()) {
            throw new BadRequestException("classId và userId không được để trống");
        }
        String currentUserId = authUtils.getUserId(request);
        classMemberService.removeMember(classId, targetUserId, currentUserId);
        return ResponseEntity.ok(MessageResponse.of("Đã xóa thành viên thành công"));
    }

    @GetMapping("/my-classes")
    public ResponseEntity<Map<String, Object>> getMyClasses(HttpServletRequest request) {
        String userId = authUtils.getUserId(request);
        Map<String, Object> myClasses = classMemberService.getClassesOfCurrentStudent(userId);
        return ResponseEntity.ok(myClasses);
    }
}
