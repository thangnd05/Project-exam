package com.project_exam.backend.services;

import com.project_exam.backend.dto.response.ClassMemberResponse;
import com.project_exam.backend.dto.response.ClassStudentResponse;
import com.project_exam.backend.models.ClassEntity;
import com.project_exam.backend.models.ClassMember;
import com.project_exam.backend.models.ClassMember.MemberStatus;
import com.project_exam.backend.models.User;
import com.project_exam.backend.repositories.ClassMemberRepository;
import com.project_exam.backend.repositories.ClassRepository;
import com.project_exam.backend.repositories.UserRepository;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ClassMemberService {

    private final ClassMemberRepository classMemberRepository;
    private final AuthUtils authUtils;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;

    @Transactional
    public ClassMemberResponse joinClass(String classId, HttpServletRequest request) {
        String currentUserId = authUtils.getUserId(request);

        if (classMemberRepository.existsByClassIdAndUserId(classId, currentUserId)) {
            throw new RuntimeException("You have already requested or joined this class!");
        }

        ClassMember member = ClassMember.builder()
                .classId(classId)
                .userId(currentUserId)
                .status(MemberStatus.PENDING)
                .joinedAt(LocalDateTime.now())
                .build();

        member = classMemberRepository.save(member);
        return toResponse(member);
    }

    // 🟢 Duyệt 1 học sinh (teacher duyệt)
    @Transactional
    public void approveSingle(String classId, String userId, HttpServletRequest request) {
        String currentUserId = authUtils.getUserId(request);

        // 🔹 Kiểm tra lớp tồn tại
        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found with ID: " + classId));

        // 🔹 Kiểm tra quyền
        if (!clazz.getTeacherId().equals(currentUserId)) {
            throw new RuntimeException("You are not authorized to approve this class!");
        }

        // 🔹 Tiến hành duyệt
        int updated = classMemberRepository.approveSingle(classId, userId);
        if (updated == 0) {
            throw new RuntimeException("Member not found or already approved!");
        }
    }

    // 🟢 Duyệt tất cả học sinh đang chờ trong lớp
    @Transactional
    public int approveAll(String classId, HttpServletRequest request) {
        String currentUserId = authUtils.getUserId(request);

        // 🔹 Kiểm tra lớp tồn tại
        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found with ID: " + classId));

        // 🔹 Kiểm tra quyền (chỉ giáo viên tạo lớp mới được duyệt)
        if (!clazz.getTeacherId().equals(currentUserId)) {
            throw new RuntimeException("You are not authorized to approve all members in this class!");
        }

        // 🔹 Duyệt tất cả học sinh đang chờ
        return classMemberRepository.approveAllPending(classId);
    }

    public List<ClassMemberResponse> getAllMembers(String classId) {
        return classMemberRepository.findByClassId(classId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ClassMemberResponse> getPendingMembers(String classId) {
        return classMemberRepository.findByClassIdAndStatus(classId, MemberStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    private ClassMemberResponse toResponse(ClassMember m) {
        ClassMemberResponse res = new ClassMemberResponse();
        res.setId(m.getId());
        res.setClassId(m.getClassId());
        res.setUserId(m.getUserId());
        res.setStatus(m.getStatus());
        res.setJoinedAt(m.getJoinedAt());
        return res;
    }

    // 🟢 Rút khỏi lớp (student tự rời lớp)
    @Transactional
    public void leaveClass(String classId, HttpServletRequest request) {
        String currentUserId = authUtils.getUserId(request);
        classMemberRepository.removeStudent(classId, currentUserId);
    }

    // 🟢 Giáo viên xóa học sinh khỏi lớp
    @Transactional
    public void removeMember(String classId, String userId, HttpServletRequest request) {
        String currentUserId = authUtils.getUserId(request);

        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found with ID: " + classId));

        if (!clazz.getTeacherId().equals(currentUserId)) {
            throw new RuntimeException("You are not authorized to remove members from this class!");
        }

        classMemberRepository.removeStudent(classId, userId);
    }

    public Map<String, Object> getClassesOfCurrentStudent(HttpServletRequest request) {
        String currentUserId = authUtils.getUserId(request);

        Map<String, Object> result = new HashMap<>();

        // 🧩 1️⃣ Lớp mà tôi đang học (đã được duyệt)
        List<ClassMember> classMembers =
                classMemberRepository.findByUserIdAndStatus(currentUserId, ClassMember.MemberStatus.APPROVED);

        List<ClassStudentResponse> learningClasses = classMembers.stream().map(member -> {
            ClassEntity clazz = classRepository.findById(member.getClassId())
                    .orElse(null);
            if (clazz == null) return null;

            // Lấy tên giáo viên từ teacherId
            String teacherName = userRepository.findById(clazz.getTeacherId())
                    .map(User::getFullName)
                    .orElse("Unknown");

            return new ClassStudentResponse(
                    clazz.getClassId(),
                    clazz.getClassName(),
                    teacherName
            );
        }).filter(Objects::nonNull).toList();

        // 🧩 2️⃣ Lớp mà tôi dạy (nếu là giáo viên)
        List<ClassEntity> teachingClasses = classRepository.findByTeacherId(currentUserId);
        List<ClassStudentResponse> teachingResponses = teachingClasses.stream()
                .map(clazz -> new ClassStudentResponse(
                        clazz.getClassId(),
                        clazz.getClassName(),
                        userRepository.findById(clazz.getTeacherId())
                                .map(User::getFullName)
                                .orElse("Unknown")
                ))
                .toList();

        // ✅ 3️⃣ Trả kết quả gộp
        result.put("teachingClasses", teachingResponses);
        result.put("learningClasses", learningClasses);

        return result;
    }

}
