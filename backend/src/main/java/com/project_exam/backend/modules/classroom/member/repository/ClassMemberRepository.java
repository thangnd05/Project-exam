package com.project_exam.backend.modules.classroom.member.repository;

import com.project_exam.backend.modules.classroom.member.domain.ClassMember;
import com.project_exam.backend.modules.classroom.member.domain.ClassMember.MemberStatus;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassMemberRepository extends JpaRepository<ClassMember, String> {

    // Lấy tất cả học sinh trong lớp
    List<ClassMember> findByClassId(String classId);

    // Lấy danh sách học sinh theo trạng thái (pending/approved)
    List<ClassMember> findByClassIdAndStatus(String classId, MemberStatus status);

    List<ClassMember> findByUserIdAndStatus(String studentId, MemberStatus status);
    long countByUserIdAndStatus(String userId, MemberStatus status);

    // Tổng số lượt xin vào lớp đang chờ duyệt (thống kê Dashboard admin)
    long countByStatus(MemberStatus status);

    // Kiểm tra học sinh đã trong lớp chưa (mọi trạng thái — dùng khi cần biết đã có request hay chưa)
    boolean existsByClassIdAndUserId(String classId, String userId);

    // Kiểm tra học sinh đã được duyệt vào lớp chưa (dùng cho mọi gate truy cập dữ liệu lớp)
    boolean existsByClassIdAndUserIdAndStatus(String classId, String userId, MemberStatus status);

    // Duyệt 1 học sinh (UPDATE status = APPROVED)
    @Modifying
    @Query("UPDATE ClassMember c SET c.status = 'APPROVED' WHERE c.classId = :classId AND c.userId = :userId AND c.status = 'PENDING'")
    int approveSingle(@Param("classId") String classId, @Param("userId") String userId);

    // Duyệt tất cả học sinh đang chờ duyệt trong lớp
    @Modifying
    @Query("UPDATE ClassMember c SET c.status = 'APPROVED' WHERE c.classId = :classId AND c.status = 'PENDING'")
    int approveAllPending(@Param("classId") String classId);

    // Xóa 1 học sinh khỏi lớp
    @Modifying
    @Query("DELETE FROM ClassMember c WHERE c.classId = :classId AND c.userId = :userId")
    int removeStudent(@Param("classId") String classId, @Param("userId") String userId);
}
