package com.project_exam.backend.modules.classroom.clazz.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.classroom.clazz.dto.ClassRequest;
import com.project_exam.backend.modules.classroom.clazz.dto.ClassResponse;
import com.project_exam.backend.modules.classroom.clazz.dto.ClassSimpleResponse;
import com.project_exam.backend.modules.classroom.chapter.domain.Chapter;
import com.project_exam.backend.modules.classroom.clazz.domain.ClassEntity;
import com.project_exam.backend.modules.classroom.clazz.mapper.ClassMapper;
import com.project_exam.backend.modules.classroom.chapter.repository.ChapterRepository;
import com.project_exam.backend.modules.classroom.clazz.repository.ClassRepository;
import com.project_exam.backend.modules.assessment.exam.service.QuestionService;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.assessment.test.service.TestCommandService;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassService {

    private final ClassRepository classRepository;
    private final ChapterRepository chapterRepository;
    private final TestRepository testRepository;
    private final QuestionService questionService;
    private final TestCommandService testCommandService;
    private final AuthUtils authUtils;
    private final ClassMapper classMapper;

    @Transactional
    public ClassResponse createClass(ClassRequest request, String userId) {
        ClassEntity clazz = ClassEntity.builder()
                .className(request.getClassName())
                .classQr(generateUniqueClassQr())
                .description(request.getDescription())
                .teacherId(userId)
                .createdAt(Instant.now())
                .build();

        clazz = classRepository.save(clazz);
        return toResponse(clazz);
    }

    public List<ClassResponse> getClassesByTeacher(String teacherId) {
        return classRepository.findByTeacherId(teacherId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ClassSimpleResponse> getMyClasses(String userId) {
        return classRepository.findByTeacherId(userId).stream()
                .map(classMapper::toSimpleResponse)
                .toList();
    }

    public ClassResponse getById(String classId) {
        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));
        return toResponse(clazz);
    }

    @Transactional
    public void deleteClass(String classId, String userId) {
        ClassEntity existing = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found!"));

        boolean isTeacher = userId != null && userId.equals(existing.getTeacherId());
        if (!isTeacher && !authUtils.hasPermission(PermissionCatalog.CLASS_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền xoá lớp này.");
        }

        List<Test> tests = testRepository.findByClassId(classId);
        for (Test t : tests) {
            testCommandService.cascadeDeleteTestInternal(t.getTestId());
        }

        questionService.cascadeDeleteQuestionsByClass(classId);

        List<Chapter> chapters = chapterRepository.findByClassId(classId);
        if (!chapters.isEmpty()) chapterRepository.deleteAll(chapters);

        classRepository.deleteById(classId);
    }

    @Transactional
    public ClassResponse updateClass(String classId, ClassRequest request, String userId) {
        ClassEntity existing = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));

        if (!existing.getTeacherId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to update this class!");
        }

        if (request.getClassName() != null) existing.setClassName(request.getClassName());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());

        existing = classRepository.save(existing);
        return toResponse(existing);
    }

    private ClassResponse toResponse(ClassEntity c) {
        return classMapper.toResponse(c);
    }

    private String generateUniqueClassQr() {
        String candidate;
        do {
            candidate = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        } while (classRepository.existsByClassQr(candidate));
        return candidate;
    }
}
