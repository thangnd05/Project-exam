package com.project_exam.backend.modules.certificate.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.repository.UserTestRepository;
import com.project_exam.backend.modules.assessment.exam.domain.ExamCategory;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.repository.ExamCategoryRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.certificate.domain.CertificateTemplate;
import com.project_exam.backend.modules.certificate.domain.UserCertificate;
import com.project_exam.backend.modules.certificate.dto.AttemptCertificateResponse;
import com.project_exam.backend.modules.certificate.dto.CertificateDesign;
import com.project_exam.backend.modules.certificate.dto.CertificateResponse;
import com.project_exam.backend.modules.certificate.dto.CertificateVerifyResponse;
import com.project_exam.backend.modules.certificate.dto.PublicCertificateResponse;
import com.project_exam.backend.modules.certificate.mapper.CertificateMapper;
import com.project_exam.backend.modules.certificate.repository.CertificateTemplateRepository;
import com.project_exam.backend.modules.certificate.repository.UserCertificateRepository;
import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AppTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Cấp và tra cứu chứng chỉ.
 *
 * Điều kiện cấp (kiểu AWS, chỉ Đạt/Chưa đạt):
 *   - lượt làm bài là FULL_TEST đã COMPLETED của người dùng đã đăng nhập (khách không cấp)
 *   - đề thuộc nhóm đề có cờ exam_categories.certificate_eligible
 *   - loại đề có mẫu chứng chỉ đang bật
 *   - tổng điểm >= passScore của mẫu
 *   - người đó chưa có chứng chỉ còn hiệu lực cho loại đề này
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateService {

    /** Bỏ I, O, 0, 1 để đọc/đánh máy lại mã không nhầm. */
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final int CODE_MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();
    /** Trần trang cho bảng vinh danh: khách không kéo được cả bảng bằng một request. */
    private static final int PUBLIC_MAX_PAGE_SIZE = 24;

    private final UserCertificateRepository userCertificateRepository;
    private final CertificateTemplateRepository certificateTemplateRepository;
    private final UserTestRepository userTestRepository;
    private final TestRepository testRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ExamCategoryRepository examCategoryRepository;
    private final UserRepository userRepository;
    private final CertificateMapper certificateMapper;

    // ------------------------------------------------------------------ cấp phát

    /**
     * Cấp chứng chỉ nếu lượt làm bài vừa chốt đủ điều kiện. Gọi sau khi commit lượt làm bài
     * nên chạy trong transaction riêng: chứng chỉ hỏng thì bài thi vẫn phải nộp được.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<UserCertificate> issueIfEligible(String userTestId) {
        UserTest userTest = userTestRepository.findById(userTestId).orElse(null);
        if (userTest == null || !isAttemptEligible(userTest)) {
            return Optional.empty();
        }

        Test test = testRepository.findById(userTest.getTestId()).orElse(null);
        if (test == null || !isCertificateEligibleTest(test)) {
            return Optional.empty();
        }

        CertificateTemplate template = findActiveTemplate(test.getExamTypeId()).orElse(null);
        if (template == null || !isPassed(userTest.getTotalScore(), template)) {
            return Optional.empty();
        }

        // Đã có chứng chỉ còn hiệu lực thì thi lại bao nhiêu lần cũng không cấp thêm.
        Optional<UserCertificate> existing = userCertificateRepository
                .findByUserIdAndExamTypeIdAndStatus(
                        userTest.getUserId(), test.getExamTypeId(), UserCertificate.Status.ACTIVE);
        if (existing.isPresent()) {
            return Optional.empty();
        }

        try {
            return Optional.of(create(userTest, test, template));
        } catch (DataIntegrityViolationException e) {
            // Hai lượt nộp gần như cùng lúc: unique index đã chặn, coi như đã có chứng chỉ.
            log.debug("Chứng chỉ đã tồn tại cho user {} loại đề {}", userTest.getUserId(), test.getExamTypeId());
            return Optional.empty();
        }
    }

    private UserCertificate create(UserTest userTest, Test test, CertificateTemplate template) {
        ExamType examType = examTypeRepository.findById(test.getExamTypeId()).orElse(null);
        String examTypeName = examType != null ? examType.getName() : null;

        User user = userRepository.findById(userTest.getUserId()).orElse(null);
        String recipientName = resolveRecipientName(user);

        CertificateDesign design = certificateMapper.toDesign(template, examTypeName);
        Instant issuedAt = Instant.now();

        UserCertificate certificate = new UserCertificate();
        certificate.setUserId(userTest.getUserId());
        certificate.setExamTypeId(test.getExamTypeId());
        certificate.setTemplateId(template.getTemplateId());
        certificate.setUserTestId(userTest.getUserTestId());
        certificate.setTestId(test.getTestId());
        certificate.setCertificateCode(generateCode(issuedAt));
        certificate.setScore(userTest.getTotalScore());
        certificate.setStatus(UserCertificate.Status.ACTIVE);
        certificate.setRecipientName(recipientName);
        certificate.setTestTitle(test.getTitle());
        certificate.setTemplateSnapshot(certificateMapper.writeSnapshot(design));
        certificate.setIssuedAt(issuedAt);
        certificate.setExpiresAt(template.getValidMonths() == null
                ? null
                : issuedAt.atZone(AppTime.ZONE).plusMonths(template.getValidMonths()).toInstant());

        UserCertificate saved = userCertificateRepository.save(certificate);
        log.info("Đã cấp chứng chỉ {} cho user {} (loại đề {}, {} điểm)",
                saved.getCertificateCode(), saved.getUserId(), saved.getExamTypeId(), saved.getScore());
        return saved;
    }

    private boolean isAttemptEligible(UserTest userTest) {
        return userTest.getUserId() != null
                && userTest.getStatus() == UserTest.Status.COMPLETED
                && !userTest.isPractice()
                && userTest.getTotalScore() != null;
    }

    /**
     * Đề có được cấp chứng chỉ hay không do cờ trên nhóm đề quyết định, không hardcode
     * code 'FULL_MOCK': admin đổi tên nhóm hay thêm nhóm mới không phải sửa code.
     */
    private boolean isCertificateEligibleTest(Test test) {
        if (test.getExamCategoryId() == null) {
            return false;
        }
        return examCategoryRepository.findById(test.getExamCategoryId())
                .map(ExamCategory::getCertificateEligible)
                .map(Boolean.TRUE::equals)
                .orElse(false);
    }

    private boolean isPassed(Integer score, CertificateTemplate template) {
        return score != null && template.getPassScore() != null && score >= template.getPassScore();
    }

    private Optional<CertificateTemplate> findActiveTemplate(String examTypeId) {
        return certificateTemplateRepository.findByExamTypeId(examTypeId)
                .filter(t -> Boolean.TRUE.equals(t.getActive()));
    }

    private String resolveRecipientName(User user) {
        if (user == null) return "Học viên";
        if (user.getFullName() != null && !user.getFullName().isBlank()) return user.getFullName();
        if (user.getUserName() != null && !user.getUserName().isBlank()) return user.getUserName();
        return "Học viên";
    }

    private String generateCode(Instant issuedAt) {
        int year = AppTime.localDate(issuedAt).getYear();
        for (int attempt = 0; attempt < CODE_MAX_ATTEMPTS; attempt++) {
            StringBuilder suffix = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                suffix.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            String code = "EXAM-" + year + "-" + suffix;
            if (!userCertificateRepository.existsByCertificateCode(code)) {
                return code;
            }
        }
        // Hết lượt bốc trùng thì rơi về mã theo thời gian, vẫn duy nhất.
        return "EXAM-" + year + "-" + Long.toString(issuedAt.toEpochMilli(), 36).toUpperCase();
    }

    // ------------------------------------------------------------------ đọc

    @Transactional(readOnly = true)
    public List<CertificateResponse> findMine(String userId) {
        return userCertificateRepository.findByUserIdOrderByIssuedAtDesc(userId).stream()
                .map(c -> certificateMapper.toResponse(c, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public CertificateResponse findOwned(String certificateId, String userId) {
        UserCertificate certificate = userCertificateRepository.findById(certificateId)
                .orElseThrow(() -> new NotFoundException("Chứng chỉ không tồn tại"));
        if (!certificate.getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền xem chứng chỉ này.");
        }
        return certificateMapper.toResponse(certificate, false);
    }

    @Transactional(readOnly = true)
    public CertificateVerifyResponse verify(String code) {
        if (code == null || code.isBlank()) {
            return certificateMapper.notFound(code);
        }
        return userCertificateRepository.findByCertificateCode(code.trim().toUpperCase())
                .map(c -> certificateMapper.toVerifyResponse(c, resolveState(c)))
                .orElseGet(() -> certificateMapper.notFound(code));
    }

    // ------------------------------------------------------------------ công khai

    /** Danh sách chứng chỉ đã cấp, công khai. Mới cấp trước, lọc được theo loại đề. */
    @Transactional(readOnly = true)
    public PageResponse<PublicCertificateResponse> findPublicFeed(String examTypeId, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), PUBLIC_MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "issuedAt"));
        String examTypeFilter = (examTypeId == null || examTypeId.isBlank()) ? null : examTypeId;

        Page<UserCertificate> result = userCertificateRepository
                .findPublicFeed(examTypeFilter, Instant.now(), pageable);
        return PageResponse.from(result, certificateMapper::toPublicResponse);
    }

    private String resolveState(UserCertificate certificate) {
        if (certificate.getStatus() == UserCertificate.Status.REVOKED) return "REVOKED";
        if (certificate.isExpired(Instant.now())) return "EXPIRED";
        return "VALID";
    }

    /**
     * Trạng thái chứng chỉ của một lượt làm bài, để trang kết quả biết hiện băng chúc mừng,
     * hiện "bạn đã có chứng chỉ" hay hiện còn thiếu bao nhiêu điểm.
     */
    @Transactional(readOnly = true)
    public AttemptCertificateResponse getForAttempt(String userTestId, String userId) {
        UserTest userTest = userTestRepository.findById(userTestId)
                .orElseThrow(() -> new NotFoundException("Lượt làm bài không tồn tại"));
        if (userTest.getUserId() == null || !userTest.getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền xem kết quả này.");
        }

        AttemptCertificateResponse notApplicable = AttemptCertificateResponse.builder()
                .state("NOT_APPLICABLE")
                .score(userTest.getTotalScore())
                .build();

        if (!isAttemptEligible(userTest)) {
            return notApplicable;
        }
        Test test = testRepository.findById(userTest.getTestId()).orElse(null);
        if (test == null || !isCertificateEligibleTest(test)) {
            return notApplicable;
        }
        CertificateTemplate template = findActiveTemplate(test.getExamTypeId()).orElse(null);
        if (template == null) {
            return notApplicable;
        }

        Optional<UserCertificate> fromThisAttempt = userCertificateRepository.findByUserTestId(userTestId)
                .filter(c -> c.getStatus() == UserCertificate.Status.ACTIVE);
        if (fromThisAttempt.isPresent()) {
            return AttemptCertificateResponse.builder()
                    .state("JUST_ISSUED")
                    .score(userTest.getTotalScore())
                    .passScore(template.getPassScore())
                    .certificate(certificateMapper.toResponse(fromThisAttempt.get(), false))
                    .build();
        }

        Optional<UserCertificate> owned = userCertificateRepository
                .findByUserIdAndExamTypeIdAndStatus(userId, test.getExamTypeId(), UserCertificate.Status.ACTIVE);
        if (owned.isPresent()) {
            return AttemptCertificateResponse.builder()
                    .state("ALREADY_OWNED")
                    .score(userTest.getTotalScore())
                    .passScore(template.getPassScore())
                    .certificate(certificateMapper.toResponse(owned.get(), false))
                    .build();
        }

        int score = userTest.getTotalScore() == null ? 0 : userTest.getTotalScore();
        return AttemptCertificateResponse.builder()
                .state("NOT_PASSED")
                .score(score)
                .passScore(template.getPassScore())
                .pointsToPass(Math.max(0, template.getPassScore() - score))
                .build();
    }
}
