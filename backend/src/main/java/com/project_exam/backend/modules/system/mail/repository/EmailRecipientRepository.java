package com.project_exam.backend.modules.system.mail.repository;

import com.project_exam.backend.modules.system.mail.domain.EmailRecipient;
import com.project_exam.backend.modules.system.mail.domain.EmailStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface EmailRecipientRepository extends JpaRepository<EmailRecipient, String> {

    Page<EmailRecipient> findByEmailIdOrderByCreatedAtDesc(String emailId, Pageable pageable);

    List<EmailRecipient> findByEmailIdAndStatus(String emailId, EmailStatus status);

    /** Đếm gộp theo (emailId, status) cho danh sách  tránh N+1 khi dựng bảng. */
    @Query("SELECT r.emailId, r.status, COUNT(r) FROM EmailRecipient r "
            + "WHERE r.emailId IN :emailIds GROUP BY r.emailId, r.status")
    List<Object[]> countGroupedByEmailIds(Collection<String> emailIds);

    /** Đưa các mail lỗi của một email về hàng chờ để worker gửi lại. */
    @Modifying
    @Query("UPDATE EmailRecipient r SET r.status = com.project_exam.backend.modules.system.mail.domain.EmailStatus.PENDING, "
            + "r.errorMessage = NULL WHERE r.emailId = :emailId "
            + "AND r.status = com.project_exam.backend.modules.system.mail.domain.EmailStatus.FAILED")
    int requeueFailed(String emailId);
}
