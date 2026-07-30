package com.project_exam.backend.shared.util;

import com.project_exam.backend.modules.classroom.chapter.domain.Chapter;
import com.project_exam.backend.modules.classroom.member.domain.ClassMember;
import com.project_exam.backend.modules.classroom.chapter.repository.ChapterRepository;
import com.project_exam.backend.modules.classroom.member.repository.ClassMemberRepository;
import com.project_exam.backend.modules.classroom.clazz.repository.ClassRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.security.PermissionCatalog;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClassAccessGuard {

    private final ClassRepository classRepository;
    private final ClassMemberRepository classMemberRepository;
    private final ChapterRepository chapterRepository;
    private final AuthUtils authUtils;

    public void requireMemberOrTeacher(String classId, String userId, HttpServletRequest request) {
        if (classId == null) {
            throw new BadRequestException("classId không được để trống.");
        }
        if (userId == null) {
            throw new ForbiddenException("Chưa xác định được người dùng.");
        }
        if (authUtils.hasPermission(PermissionCatalog.CLASS_MANAGE)) return;
        boolean isApprovedMember = classMemberRepository.existsByClassIdAndUserIdAndStatus(
                classId, userId, ClassMember.MemberStatus.APPROVED);
        boolean isTeacher = classRepository.existsByClassIdAndTeacherId(classId, userId);
        if (!isApprovedMember && !isTeacher) {
            throw new ForbiddenException("Bạn không có quyền truy cập lớp này.");
        }
    }

    public void requireTeacher(String classId, String userId, HttpServletRequest request) {
        if (classId == null) {
            throw new BadRequestException("classId không được để trống.");
        }
        if (userId == null) {
            throw new ForbiddenException("Chưa xác định được người dùng.");
        }
        if (authUtils.hasPermission(PermissionCatalog.CLASS_MANAGE)) return;
        if (!classRepository.existsByClassIdAndTeacherId(classId, userId)) {
            throw new ForbiddenException("Bạn không phải giáo viên của lớp này.");
        }
    }

    public void requireChapterInClass(String chapterId, String classId) {
        if (chapterId == null) return;
        if (classId == null) {
            throw new BadRequestException("Khi có chapterId thì phải có classId.");
        }
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter không tồn tại: " + chapterId));
        if (!classId.equals(chapter.getClassId())) {
            throw new ForbiddenException("Chapter không thuộc lớp được chỉ định.");
        }
    }
}
