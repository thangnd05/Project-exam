package com.project_exam.backend.modules.classroom.member.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.classroom.member.dto.ClassMemberResponse;
import com.project_exam.backend.modules.classroom.member.dto.MyClassesResponse;
import com.project_exam.backend.modules.classroom.clazz.dto.ClassStudentResponse;
import com.project_exam.backend.modules.classroom.clazz.domain.ClassEntity;
import com.project_exam.backend.modules.classroom.member.domain.ClassMember;
import com.project_exam.backend.modules.classroom.member.domain.ClassMember.MemberStatus;
import com.project_exam.backend.modules.classroom.clazz.mapper.ClassMapper;
import com.project_exam.backend.modules.classroom.member.mapper.ClassMemberMapper;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.classroom.member.repository.ClassMemberRepository;
import com.project_exam.backend.modules.classroom.clazz.repository.ClassRepository;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassMemberService {

    private final ClassMemberRepository classMemberRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final ClassMemberMapper classMemberMapper;
    private final ClassMapper classMapper;

    @Transactional
    public ClassMemberResponse joinClassByQr(String classQr, String userId) {
        ClassEntity clazz = classRepository.findByClassQr(classQr)
                .orElseThrow(() -> new NotFoundException("Class not found with QR: " + classQr));
        String classId = clazz.getClassId();

        if (classMemberRepository.existsByClassIdAndUserId(classId, userId)) {
            throw new BadRequestException("You have already requested or joined this class!");
        }

        ClassMember member = ClassMember.builder()
                .classId(classId)
                .userId(userId)
                .status(MemberStatus.PENDING)
                .joinedAt(Instant.now())
                .build();

        member = classMemberRepository.save(member);
        return toResponse(member);
    }

    @Transactional
    public void approveSingle(String classId, String targetUserId, String currentUserId) {
        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));

        if (!clazz.getTeacherId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to approve this class!");
        }

        int updated = classMemberRepository.approveSingle(classId, targetUserId);
        if (updated == 0) {
            throw new BadRequestException("Member not found or already approved!");
        }
    }

    @Transactional
    public int approveAll(String classId, String currentUserId) {
        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));

        if (!clazz.getTeacherId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to approve all members in this class!");
        }

        return classMemberRepository.approveAllPending(classId);
    }

    public List<ClassMemberResponse> getAllMembers(String classId) {
        return toResponses(classMemberRepository.findByClassId(classId));
    }

    public List<ClassMemberResponse> getPendingMembers(String classId) {
        return toResponses(
                classMemberRepository.findByClassIdAndStatus(classId, MemberStatus.PENDING));
    }

    private ClassMemberResponse toResponse(ClassMember m) {
        User user = userRepository.findById(m.getUserId()).orElse(null);
        return classMemberMapper.toResponse(m, user);
    }

    private List<ClassMemberResponse> toResponses(List<ClassMember> members) {
        if (members.isEmpty()) {
            return List.of();
        }
        Map<String, User> usersById = loadUsersById(
                members.stream().map(ClassMember::getUserId).toList());
        return members.stream()
                .map(m -> classMemberMapper.toResponse(m, usersById.get(m.getUserId())))
                .toList();
    }

    private Map<String, User> loadUsersById(Collection<String> userIds) {
        Set<String> distinctIds = userIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (distinctIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(distinctIds).stream()
                .collect(Collectors.toMap(User::getUserId, u -> u, (a, b) -> a));
    }

    @Transactional
    public void leaveClass(String classId, String userId) {
        classMemberRepository.removeStudent(classId, userId);
    }

    @Transactional
    public void removeMember(String classId, String targetUserId, String currentUserId) {
        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));

        if (!clazz.getTeacherId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to remove members from this class!");
        }

        classMemberRepository.removeStudent(classId, targetUserId);
    }

    public MyClassesResponse getClassesOfCurrentStudent(String userId) {
        List<ClassMember> classMembers =
                classMemberRepository.findByUserIdAndStatus(userId, ClassMember.MemberStatus.APPROVED);

        Map<String, ClassEntity> classesById = loadClassesById(
                classMembers.stream().map(ClassMember::getClassId).toList());
        Map<String, User> teachersById = loadUsersById(
                classesById.values().stream().map(ClassEntity::getTeacherId).toList());

        List<ClassStudentResponse> learningClasses = classMembers.stream()
                .map(member -> classesById.get(member.getClassId()))
                .filter(Objects::nonNull)
                .map(clazz -> classMapper.toStudentResponse(
                        clazz, teacherName(teachersById.get(clazz.getTeacherId()))))
                .toList();

        String currentUserName = teacherName(userRepository.findById(userId).orElse(null));
        List<ClassStudentResponse> teachingResponses = classRepository.findByTeacherId(userId).stream()
                .map(clazz -> classMapper.toStudentResponse(clazz, currentUserName))
                .toList();

        return MyClassesResponse.builder()
                .teachingClasses(teachingResponses)
                .learningClasses(learningClasses)
                .build();
    }

    private Map<String, ClassEntity> loadClassesById(Collection<String> classIds) {
        Set<String> distinctIds = classIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (distinctIds.isEmpty()) {
            return Map.of();
        }
        return classRepository.findAllById(distinctIds).stream()
                .collect(Collectors.toMap(ClassEntity::getClassId, c -> c, (a, b) -> a));
    }

    private String teacherName(User teacher) {
        return teacher != null && teacher.getFullName() != null
                ? teacher.getFullName()
                : "Unknown";
    }

}
