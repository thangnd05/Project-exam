package com.project_exam.backend.modules.classroom.chapter.service;
import com.project_exam.backend.shared.security.PermissionCatalog;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.classroom.chapter.dto.ChapterRequest;
import com.project_exam.backend.modules.classroom.chapter.dto.ChapterResponse;
import com.project_exam.backend.modules.classroom.chapter.domain.Chapter;
import com.project_exam.backend.modules.classroom.clazz.domain.ClassEntity;
import com.project_exam.backend.modules.classroom.chapter.mapper.ChapterMapper;
import com.project_exam.backend.modules.classroom.chapter.repository.ChapterRepository;
import com.project_exam.backend.modules.classroom.clazz.repository.ClassRepository;
import com.project_exam.backend.modules.assessment.exam.service.QuestionService;
import com.project_exam.backend.shared.util.AuthUtils;
import com.project_exam.backend.shared.util.ClassAccessGuard;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final ClassRepository classRepository;
    private final AuthUtils authUtils;
    private final ClassAccessGuard classAccessGuard;
    private final QuestionService questionService;
    private final ChapterMapper chapterMapper;

    private void checkTeacherPermission(String classId, String currentUserId) {

        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        if (!clazz.getTeacherId().equals(currentUserId)) {
            throw new ForbiddenException("Forbidden: You are not the teacher of this class");
        }
    }

    // ============================
    //  Helper convert Entity → DTO
    // ============================
    private ChapterResponse toResponse(Chapter c) {
        return chapterMapper.toResponse(c);
    }

    // ============================
    //  CREATE
    // ============================
    public ChapterResponse create(HttpServletRequest httpRequest, ChapterRequest request) {

        String currentUserId = authUtils.getUserId(httpRequest);
        checkTeacherPermission(request.getClassId(), currentUserId);

        Chapter chapter = new Chapter();
        chapter.setClassId(request.getClassId());
        chapter.setTitle(request.getTitle());
        chapter.setDescription(request.getDescription());
        chapter.setCreatedAt(LocalDateTime.now());

        Chapter saved = chapterRepository.save(chapter);

        return toResponse(saved);
    }

    // ============================
    //  GET ALL — chỉ admin được xem toàn bộ chapter.
    // ============================
    public List<ChapterResponse> getAll(HttpServletRequest httpRequest) {
        if (!authUtils.hasPermission(PermissionCatalog.CLASS_MANAGE)) {
            throw new ForbiddenException("Chỉ admin được xem toàn bộ chapter.");
        }
        return chapterRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ============================
    //  GET BY CLASS
    // ============================
    public List<ChapterResponse> getByClassId(String classId, HttpServletRequest httpRequest) {
        // 🔒 Chỉ thành viên/giáo viên của lớp (hoặc admin) mới được liệt kê chapter của lớp.
        String currentUserId = authUtils.getUserId(httpRequest);
        classAccessGuard.requireMemberOrTeacher(classId, currentUserId, httpRequest);

        return chapterRepository.findByClassId(classId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ============================
    //  GET BY ID
    // ============================
    public ChapterResponse getById(String chapterId, HttpServletRequest httpRequest) {

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        // 🔒 Chỉ thành viên/giáo viên của lớp chứa chapter mới được xem.
        String currentUserId = authUtils.getUserId(httpRequest);
        classAccessGuard.requireMemberOrTeacher(chapter.getClassId(), currentUserId, httpRequest);

        return toResponse(chapter);
    }

    // ============================
    //  UPDATE
    // ============================
    public ChapterResponse update(HttpServletRequest httpRequest,
                                  String chapterId,
                                  ChapterRequest request) {

        String currentUserId = authUtils.getUserId(httpRequest);

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        checkTeacherPermission(chapter.getClassId(), currentUserId);

        if (request.getClassId() != null &&
                !request.getClassId().equals(chapter.getClassId())) {
            throw new BadRequestException("You cannot change classId of a chapter");
        }

        chapter.setTitle(request.getTitle());
        chapter.setDescription(request.getDescription());

        return toResponse(chapterRepository.save(chapter));
    }

    // ============================
    //  DELETE — cascade xoá toàn bộ questions thuộc chapter
    // ============================
    @Transactional
    public void delete(HttpServletRequest httpRequest, String chapterId) {

        String currentUserId = authUtils.getUserId(httpRequest);

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        //  check teacher
        checkTeacherPermission(chapter.getClassId(), currentUserId);

        // 🔥 Cascade: xoá toàn bộ questions (kèm answers/test_questions/user_answers) thuộc chapter này.
        questionService.cascadeDeleteQuestionsByChapter(chapterId);

        chapterRepository.deleteById(chapterId);
    }

}
