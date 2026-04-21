package com.project_exam.backend.services;

import com.project_exam.backend.dto.request.ClassRequest;
import com.project_exam.backend.dto.response.ClassResponse;
import com.project_exam.backend.dto.response.ClassSimpleResponse;
import com.project_exam.backend.models.ClassEntity;
import com.project_exam.backend.repositories.ClassRepository;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import java.util.concurrent.ThreadLocalRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassService {

    private final ClassRepository classRepository;
    private final AuthUtils authUtils;

    @Transactional
    public ClassResponse createClass(ClassRequest request, HttpServletRequest httpRequest) {
        String currentUserId = authUtils.getUserId(httpRequest);

        String randomId;
        do {
            randomId = UUID.randomUUID().toString();
        } while (classRepository.existsById(randomId));

        ClassEntity clazz = ClassEntity.builder()
                .classId(randomId)
                .className(request.getClassName())
                .description(request.getDescription())
                .teacherId(currentUserId)
                .createdAt(LocalDateTime.now())
                .build();

        clazz = classRepository.save(clazz);
        return toResponse(clazz);
    }

    public List<ClassResponse> getClassesByTeacher(String teacherId) {
        return classRepository.findByTeacherId(teacherId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ClassSimpleResponse> getMyClasses(HttpServletRequest request) {
        String teacherId = authUtils.getUserId(request);
        return classRepository.findByTeacherId(teacherId).stream()
                .map(c -> new ClassSimpleResponse(c.getClassId(), c.getClassName()))
                .toList();
    }

    public ClassResponse getById(String classId) {
        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found with ID: " + classId));
        return toResponse(clazz);
    }

    @Transactional
    public void deleteClass(String classId) {
        if (!classRepository.existsById(classId)) {
            throw new RuntimeException("Class not found!");
        }
        classRepository.deleteById(classId);
    }

    public String getCurrentTeacherId(HttpServletRequest request) {
        return authUtils.getUserId(request);
    }

    @Transactional
    public ClassResponse updateClass(String classId, ClassRequest request, HttpServletRequest httpRequest) {
        String currentUserId = authUtils.getUserId(httpRequest);
        ClassEntity existing = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found with ID: " + classId));

        if (!existing.getTeacherId().equals(currentUserId)) {
            throw new RuntimeException("You are not authorized to update this class!");
        }

        if (request.getClassName() != null) existing.setClassName(request.getClassName());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());

        existing = classRepository.save(existing);
        return toResponse(existing);
    }

    private ClassResponse toResponse(ClassEntity c) {
        ClassResponse res = new ClassResponse();
        res.setClassId(c.getClassId());
        res.setClassName(c.getClassName());
        res.setDescription(c.getDescription());
        res.setTeacherId(c.getTeacherId());
        res.setCreatedAt(c.getCreatedAt());
        return res;
    }
}
