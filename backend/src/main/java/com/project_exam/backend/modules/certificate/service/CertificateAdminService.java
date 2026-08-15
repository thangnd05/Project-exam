package com.project_exam.backend.modules.certificate.service;

import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.certificate.domain.CertificateTemplate;
import com.project_exam.backend.modules.certificate.domain.UserCertificate;
import com.project_exam.backend.modules.certificate.dto.CertificateResponse;
import com.project_exam.backend.modules.certificate.dto.CertificateTemplateRequest;
import com.project_exam.backend.modules.certificate.dto.CertificateTemplateResponse;
import com.project_exam.backend.modules.certificate.mapper.CertificateMapper;
import com.project_exam.backend.modules.certificate.repository.CertificateTemplateRepository;
import com.project_exam.backend.modules.certificate.repository.UserCertificateRepository;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificateAdminService {

    private static final int MAX_PAGE_SIZE = 100;

    private final CertificateTemplateRepository certificateTemplateRepository;
    private final UserCertificateRepository userCertificateRepository;
    private final ExamTypeRepository examTypeRepository;
    private final CertificateMapper certificateMapper;

    // ------------------------------------------------------------------ mẫu chứng chỉ

    @Transactional(readOnly = true)
    public List<CertificateTemplateResponse> findAllTemplates() {
        List<CertificateTemplate> templates = certificateTemplateRepository.findAll();
        Map<String, String> examTypeNames = examTypeNames(templates);
        Map<String, Long> issuedCounts = issuedCountsByTemplate();

        return templates.stream()
                .map(t -> certificateMapper.toTemplateResponse(
                        t,
                        examTypeNames.get(t.getExamTypeId()),
                        issuedCounts.getOrDefault(t.getTemplateId(), 0L)))
                .sorted(Comparator.comparing(
                        CertificateTemplateResponse::getExamTypeName,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Transactional
    public CertificateTemplateResponse createTemplate(CertificateTemplateRequest request) {
        if (certificateTemplateRepository.existsByExamTypeId(request.getExamTypeId())) {
            throw new BadRequestException("Loại đề này đã có mẫu chứng chỉ, hãy sửa mẫu sẵn có.");
        }
        ExamType examType = examTypeRepository.findById(request.getExamTypeId())
                .orElseThrow(() -> new NotFoundException("Loại đề không tồn tại"));

        CertificateTemplate template = new CertificateTemplate();
        template.setExamTypeId(request.getExamTypeId());
        apply(template, request);
        template.setCreatedAt(Instant.now());
        template.setUpdatedAt(Instant.now());

        CertificateTemplate saved = certificateTemplateRepository.save(template);
        return certificateMapper.toTemplateResponse(saved, examType.getName(), 0L);
    }

    @Transactional
    public CertificateTemplateResponse updateTemplate(String templateId, CertificateTemplateRequest request) {
        CertificateTemplate template = certificateTemplateRepository.findById(templateId)
                .orElseThrow(() -> new NotFoundException("Mẫu chứng chỉ không tồn tại"));

        // Đổi loại đề của mẫu sẽ làm lệch chứng chỉ đã cấp, nên chỉ cho sửa nội dung.
        if (request.getExamTypeId() != null && !request.getExamTypeId().equals(template.getExamTypeId())) {
            throw new BadRequestException("Không đổi được loại đề của mẫu đã tạo. Hãy tạo mẫu mới cho loại đề kia.");
        }
        apply(template, request);
        template.setUpdatedAt(Instant.now());

        CertificateTemplate saved = certificateTemplateRepository.save(template);
        String examTypeName = examTypeRepository.findById(saved.getExamTypeId())
                .map(ExamType::getName).orElse(null);
        return certificateMapper.toTemplateResponse(
                saved, examTypeName, issuedCountsByTemplate().getOrDefault(saved.getTemplateId(), 0L));
    }

    @Transactional
    public void deleteTemplate(String templateId) {
        CertificateTemplate template = certificateTemplateRepository.findById(templateId)
                .orElseThrow(() -> new NotFoundException("Mẫu chứng chỉ không tồn tại"));
        certificateTemplateRepository.delete(template);
    }

    private void apply(CertificateTemplate template, CertificateTemplateRequest request) {
        template.setPassScore(request.getPassScore());
        template.setTitle(request.getTitle());
        template.setSubtitle(request.getSubtitle());
        template.setFooterNote(request.getFooterNote());
        template.setLogoUrl(request.getLogoUrl());
        template.setBackgroundUrl(request.getBackgroundUrl());
        template.setAccentColor(request.getAccentColor());
        template.setIssuerName(request.getIssuerName());
        template.setSignatureName(request.getSignatureName());
        template.setSignatureTitle(request.getSignatureTitle());
        template.setSignatureImageUrl(request.getSignatureImageUrl());
        template.setValidMonths(request.getValidMonths());
        template.setActive(request.getActive() == null ? Boolean.TRUE : request.getActive());
    }

    private Map<String, String> examTypeNames(List<CertificateTemplate> templates) {
        List<String> ids = templates.stream().map(CertificateTemplate::getExamTypeId).distinct().toList();
        if (ids.isEmpty()) return Map.of();
        return examTypeRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(ExamType::getExamTypeId, ExamType::getName));
    }

    private Map<String, Long> issuedCountsByTemplate() {
        return userCertificateRepository.countActiveGroupedByTemplate().stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));
    }

    // ------------------------------------------------------------------ chứng chỉ đã cấp

    @Transactional(readOnly = true)
    public PageResponse<CertificateResponse> searchIssued(String examTypeId, String status,
                                                          String keyword, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "issuedAt"));

        UserCertificate.Status statusFilter = parseStatus(status);
        String keywordFilter = (keyword == null || keyword.isBlank())
                ? "%"
                : "%" + keyword.trim().toLowerCase() + "%";
        String examTypeFilter = (examTypeId == null || examTypeId.isBlank()) ? null : examTypeId;

        Page<UserCertificate> result = userCertificateRepository
                .search(examTypeFilter, statusFilter, keywordFilter, pageable);
        return PageResponse.from(result,
                result.getContent().stream().map(c -> certificateMapper.toResponse(c, true)).toList());
    }

    @Transactional
    public CertificateResponse revoke(String certificateId, String reason) {
        UserCertificate certificate = userCertificateRepository.findById(certificateId)
                .orElseThrow(() -> new NotFoundException("Chứng chỉ không tồn tại"));
        if (certificate.getStatus() == UserCertificate.Status.REVOKED) {
            throw new BadRequestException("Chứng chỉ này đã bị thu hồi trước đó.");
        }
        certificate.setStatus(UserCertificate.Status.REVOKED);
        certificate.setRevokedAt(Instant.now());
        certificate.setRevokedReason(reason);
        return certificateMapper.toResponse(userCertificateRepository.save(certificate), true);
    }

    /**
     * Xoá hẳn một chứng chỉ đã cấp. Khác thu hồi: thu hồi giữ lại dấu vết để người tra cứu
     * biết chứng chỉ từng tồn tại nhưng hết giá trị, còn xoá là mã tra cứu biến mất hoàn toàn.
     * Dành cho bản cấp nhầm/cấp thử, nên để đó chỉ làm bẩn dữ liệu.
     */
    @Transactional
    public void deleteIssued(String certificateId) {
        UserCertificate certificate = userCertificateRepository.findById(certificateId)
                .orElseThrow(() -> new NotFoundException("Chứng chỉ không tồn tại"));
        userCertificateRepository.delete(certificate);
    }

    private UserCertificate.Status parseStatus(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return UserCertificate.Status.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái không hợp lệ: " + raw);
        }
    }
}
