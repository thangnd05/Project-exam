package com.project_exam.backend.modules.certificate.repository;

import com.project_exam.backend.modules.certificate.domain.UserCertificate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserCertificateRepository extends JpaRepository<UserCertificate, String> {

    Optional<UserCertificate> findByCertificateCode(String certificateCode);

    Optional<UserCertificate> findByUserIdAndExamTypeIdAndStatus(
            String userId, String examTypeId, UserCertificate.Status status);

    List<UserCertificate> findByUserIdOrderByIssuedAtDesc(String userId);

    Optional<UserCertificate> findByUserTestId(String userTestId);

    boolean existsByCertificateCode(String certificateCode);

    long countByStatus(UserCertificate.Status status);

    /** [templateId, số chứng chỉ còn hiệu lực] cho bảng mẫu ở trang quản trị. */
    @Query("""
            SELECT c.templateId, COUNT(c) FROM UserCertificate c
            WHERE c.status = com.project_exam.backend.modules.certificate.domain.UserCertificate.Status.ACTIVE
              AND c.templateId IS NOT NULL
            GROUP BY c.templateId
            """)
    List<Object[]> countActiveGroupedByTemplate();

    /**
     * Danh sách công khai: chỉ chứng chỉ còn hiệu lực, mới cấp trước.
     * Chứng chỉ bị thu hồi hoặc hết hạn không lên danh sách.
     */
    @Query("""
            SELECT c FROM UserCertificate c
            WHERE c.status = com.project_exam.backend.modules.certificate.domain.UserCertificate.Status.ACTIVE
              AND (c.expiresAt IS NULL OR c.expiresAt > :now)
              AND (:examTypeId IS NULL OR c.examTypeId = :examTypeId)
            """)
    Page<UserCertificate> findPublicFeed(@Param("examTypeId") String examTypeId,
                                         @Param("now") Instant now,
                                         Pageable pageable);

    @Query("""
            SELECT c FROM UserCertificate c
            WHERE (:examTypeId IS NULL OR c.examTypeId = :examTypeId)
              AND (:status IS NULL OR c.status = :status)
              AND (LOWER(c.recipientName) LIKE :keyword
                   OR LOWER(c.certificateCode) LIKE :keyword)
            """)
    Page<UserCertificate> search(@Param("examTypeId") String examTypeId,
                                 @Param("status") UserCertificate.Status status,
                                 @Param("keyword") String keyword,
                                 Pageable pageable);
}
