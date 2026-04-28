package com.project_exam.backend.modules.classroom.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.classroom.dto.ChapterRequest;
import com.project_exam.backend.modules.classroom.dto.ChapterResponse;
import com.project_exam.backend.modules.classroom.domain.Chapter;
import com.project_exam.backend.modules.classroom.domain.ClassEntity;
import com.project_exam.backend.modules.classroom.repository.ChapterRepository;
import com.project_exam.backend.modules.classroom.repository.ClassRepository;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final ClassRepository classRepository;
    private final AuthUtils authUtils;

    private void checkTeacherPermission(String classId, String currentUserId) {

        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        if (!clazz.getTeacherId().equals(currentUserId)) {
            throw new ForbiddenException("Forbidden: You are not the teacher of this class");
        }
    }

    // ============================
    // ✅ Helper convert Entity → DTO
    // ============================
    private ChapterResponse toResponse(Chapter c) {
        return new ChapterResponse(
                c.getChapterId(),
                c.getClassId(),
                c.getTitle(),
                c.getDescription(),
                c.getCreatedAt()
        );
    }

    // ============================
    // ✅ CREATE
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
    // ✅ GET ALL
    // ============================
    public List<ChapterResponse> getAll() {
        return chapterRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ============================
    // ✅ GET BY CLASS
    // ============================
    public List<ChapterResponse> getByClassId(String classId) {
        return chapterRepository.findByClassId(classId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ============================
    // ✅ GET BY ID
    // ============================
    public ChapterResponse getById(String chapterId) {

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        return toResponse(chapter);
    }

    // ============================
    // ✅ UPDATE
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
    // ✅ DELETE
    // ============================
    public void delete(HttpServletRequest httpRequest, String chapterId) {

        String currentUserId = authUtils.getUserId(httpRequest);

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        // ✅ check teacher
        checkTeacherPermission(chapter.getClassId(), currentUserId);

        chapterRepository.deleteById(chapterId);
    }

}
