package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.classroom.clazz.repository.ClassRepository;
import com.project_exam.backend.modules.classroom.member.domain.ClassMember.MemberStatus;
import com.project_exam.backend.modules.classroom.member.repository.ClassMemberRepository;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassTestQueryService {

    private final TestRepository testRepository;
    private final ClassRepository classRepository;
    private final ClassMemberRepository classMemberRepository;
    private final TestSummaryAssembler summaryAssembler;

    public List<TestResponse> getTestByClassId(String classId, String currentUserId) {
        requireClassViewer(classId, currentUserId);
        return summaryAssembler.buildUserTestSummariesBatch(testRepository.findByClassId(classId), currentUserId);
    }

    public List<TestResponse> getTestByClassIdAndChapterId(String classId, String chapterId, String currentUserId) {
        requireClassViewer(classId, currentUserId);
        return summaryAssembler.buildUserTestSummariesBatch(
                testRepository.findByClassIdAndChapterId(classId, chapterId), currentUserId);
    }

    private void requireClassViewer(String classId, String currentUserId) {
        if (currentUserId == null) {
            throw new UnauthorizedException("Bạn cần đăng nhập để xem bài kiểm tra.");
        }

        boolean isMember = classMemberRepository.existsByClassIdAndUserIdAndStatus(
                classId, currentUserId, MemberStatus.APPROVED);
        boolean isTeacher = classRepository.existsByClassIdAndTeacherId(classId, currentUserId);

        if (!isMember && !isTeacher) {
            throw new ForbiddenException("Bạn không có quyền xem bài kiểm tra của lớp này!");
        }
    }
}
