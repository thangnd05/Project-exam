package com.project_exam.backend.repositories;

import com.project_exam.backend.models.ClassMember;
import com.project_exam.backend.models.ClassMember.MemberStatus;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassMemberRepository extends JpaRepository<ClassMember, String> {

    // 🔹 Lấy tất cả học sinh trong lớp
    List<ClassMember> findByClassId(String classId);

    // 🔹 Lấy danh sách học sinh theo trạng thái (pending/approved)
    List<ClassMember> findByClassIdAndStatus(String classId, MemberStatus status);

    List<ClassMember> findByUserIdAndStatus(String studentId, MemberStatus status);
    long countByUserIdAndStatus(String userId, MemberStatus status);

    // 🔹 Kiểm tra học sinh đã trong lớp chưa
    boolean existsByClassIdAndUserId(String classId, String userId);

    // 🔹 Duyệt 1 học sinh (UPDATE status = APPROVED)
    @Modifying
    @Query("UPDATE ClassMember c SET c.status = 'APPROVED' WHERE c.classId = :classId AND c.userId = :userId AND c.status = 'PENDING'")
    int approveSingle(@Param("classId") String classId, @Param("userId") String userId);

    // 🔹 Duyệt tất cả học sinh đang chờ duyệt trong lớp
    @Modifying
    @Query("UPDATE ClassMember c SET c.status = 'APPROVED' WHERE c.classId = :classId AND c.status = 'PENDING'")
    int approveAllPending(@Param("classId") String classId);

    // 🔹 Xóa 1 học sinh khỏi lớp
    @Modifying
    @Query("DELETE FROM ClassMember c WHERE c.classId = :classId AND c.userId = :userId")
    int removeStudent(@Param("classId") String classId, @Param("userId") String userId);
}
