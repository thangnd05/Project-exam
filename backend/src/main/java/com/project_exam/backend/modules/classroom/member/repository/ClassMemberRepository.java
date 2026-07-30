package com.project_exam.backend.modules.classroom.member.repository;

import com.project_exam.backend.modules.classroom.member.domain.ClassMember;
import com.project_exam.backend.modules.classroom.member.domain.ClassMember.MemberStatus;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassMemberRepository extends JpaRepository<ClassMember, String> {

    List<ClassMember> findByClassId(String classId);

    List<ClassMember> findByClassIdAndStatus(String classId, MemberStatus status);

    List<ClassMember> findByUserIdAndStatus(String studentId, MemberStatus status);
    long countByUserIdAndStatus(String userId, MemberStatus status);

    long countByStatus(MemberStatus status);

    boolean existsByClassIdAndUserId(String classId, String userId);

    boolean existsByClassIdAndUserIdAndStatus(String classId, String userId, MemberStatus status);

    @Modifying
    @Query("UPDATE ClassMember c SET c.status = 'APPROVED' WHERE c.classId = :classId AND c.userId = :userId AND c.status = 'PENDING'")
    int approveSingle(@Param("classId") String classId, @Param("userId") String userId);

    @Modifying
    @Query("UPDATE ClassMember c SET c.status = 'APPROVED' WHERE c.classId = :classId AND c.status = 'PENDING'")
    int approveAllPending(@Param("classId") String classId);

    @Modifying
    @Query("DELETE FROM ClassMember c WHERE c.classId = :classId AND c.userId = :userId")
    int removeStudent(@Param("classId") String classId, @Param("userId") String userId);
}
