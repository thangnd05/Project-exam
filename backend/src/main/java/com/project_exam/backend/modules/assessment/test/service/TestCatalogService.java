package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.exam.domain.ExamCategory;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.domain.Skill;
import com.project_exam.backend.modules.assessment.exam.repository.ExamCategoryRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionCollectionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.SkillRepository;
import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.TestPart;
import com.project_exam.backend.modules.assessment.test.domain.TestStatus;
import com.project_exam.backend.modules.assessment.test.dto.CertificateExamListResponse;
import com.project_exam.backend.modules.assessment.test.dto.QuickChallengeCardResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestCollectionResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestResponse;
import com.project_exam.backend.modules.assessment.test.mapper.TestMapper;
import com.project_exam.backend.modules.assessment.test.repository.TestPartRepository;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.modules.assessment.certificate.domain.CertificateTemplate;
import com.project_exam.backend.modules.assessment.certificate.domain.UserCertificate;
import com.project_exam.backend.modules.assessment.certificate.repository.CertificateTemplateRepository;
import com.project_exam.backend.modules.assessment.certificate.repository.UserCertificateRepository;
import com.project_exam.backend.modules.users.user.service.AdminUserProvider;
import com.project_exam.backend.shared.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TestCatalogService {

    private final TestRepository testRepository;
    private final TestPartRepository testPartRepository;
    private final AdminUserProvider adminUserProvider;
    private final ExamPartRepository examPartRepository;
    private final ExamCategoryRepository examCategoryRepository;
    private final ExamTypeRepository examTypeRepository;
    private final SkillRepository skillRepository;
    private final QuestionCollectionRepository questionCollectionRepository;
    private final CertificateTemplateRepository certificateTemplateRepository;
    private final UserCertificateRepository userCertificateRepository;
    private final TestMapper testMapper;
    private final TestSummaryAssembler summaryAssembler;

    public List<TestResponse> getAllTests() {
        Set<String> adminIds = adminUserProvider.adminUserIds();
        if (adminIds.isEmpty()) {
            return List.of();
        }
        List<Test> tests = testRepository.findByClassIdIsNullAndCreatedByIn(adminIds);
        return summaryAssembler.buildUserTestSummariesBatch(tests, null);
    }

    public List<QuickChallengeCardResponse> getQuickChallengeTests() {
        String categoryId = examCategoryRepository.findByCode("QUICK_CHALLENGE")
                .map(ExamCategory::getExamCategoryId)
                .orElse(null);
        if (categoryId == null) {
            return List.of();
        }
        List<Test> tests = testRepository.findByExamCategoryId(categoryId).stream()
                .filter(t -> t.calculateStatus() != TestStatus.ENDED)
                .toList();

        if (tests.isEmpty()) {
            return List.of();
        }

        Set<String> examTypeIds = tests.stream()
                .map(Test::getExamTypeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, ExamType> examTypeMap = examTypeRepository.findAllById(examTypeIds).stream()
                .collect(Collectors.toMap(ExamType::getExamTypeId, et -> et));

        Map<String, List<TestPart>> testPartsByTestId = testPartRepository
                .findByTestIdIn(tests.stream().map(Test::getTestId).toList()).stream()
                .collect(Collectors.groupingBy(TestPart::getTestId));

        Set<String> examPartIds = testPartsByTestId.values().stream()
                .flatMap(List::stream)
                .map(TestPart::getExamPartId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, ExamPart> examPartMap = examPartRepository.findAllById(examPartIds).stream()
                .collect(Collectors.toMap(ExamPart::getExamPartId, ep -> ep));

        Set<String> skillIds = examPartMap.values().stream()
                .map(ExamPart::getSkillId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, String> skillNames = skillRepository.findAllById(skillIds).stream()
                .collect(Collectors.toMap(Skill::getSkillId, Skill::getName));

        return tests.stream()
                .map(t -> buildQuickChallengeCard(
                        t,
                        examTypeMap.get(t.getExamTypeId()),
                        testPartsByTestId.getOrDefault(t.getTestId(), List.of()),
                        examPartMap,
                        skillNames))
                .toList();
    }

    public List<TestResponse> getAdminTestsByExamType(String examTypeId) {
        Set<String> adminIds = adminUserProvider.adminUserIds();
        if (adminIds.isEmpty()) return new ArrayList<>();

        List<Test> filtered = testRepository.findAll().stream()
                .filter(t -> examTypeId.equals(t.getExamTypeId()))
                .filter(t -> t.getClassId() == null)
                .filter(t -> adminIds.contains(t.getCreatedBy()))
                .toList();
        return summaryAssembler.buildUserTestSummariesBatch(filtered, null);
    }

    public PageResponse<TestResponse> getAdminTestsByExamTypePaged(String examTypeId, int page, int size, String userId) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 12 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Set<String> adminIds = adminUserProvider.adminUserIds();
        if (adminIds.isEmpty()) return PageResponse.empty(safePage, safeSize);

        Set<String> certificateCategoryIds = hasActiveCertificateTemplate(examTypeId)
                ? certificateCategoryIds()
                : Set.of();
        Page<Test> testPage = certificateCategoryIds.isEmpty()
                ? testRepository.findByExamTypeIdAndClassIdIsNullAndCreatedByIn(examTypeId, adminIds, pageable)
                : testRepository.findByExamTypeExcludingCategories(
                        examTypeId, adminIds, certificateCategoryIds, pageable);

        return summaryAssembler.toTestPageResponse(testPage, userId);
    }

    public CertificateExamListResponse getCertificateExamsByExamType(String examTypeId, String userId) {
        CertificateTemplate template = certificateTemplateRepository.findByExamTypeId(examTypeId)
                .filter(t -> Boolean.TRUE.equals(t.getActive()))
                .orElse(null);
        Set<String> categoryIds = template == null ? Set.of() : certificateCategoryIds();
        Set<String> adminIds = adminUserProvider.adminUserIds();
        if (template == null || categoryIds.isEmpty() || adminIds.isEmpty()) {
            return CertificateExamListResponse.empty();
        }

        List<Test> tests = testRepository
                .findByExamTypeIdAndClassIdIsNullAndCreatedByInAndExamCategoryIdIn(
                        examTypeId, adminIds, categoryIds)
                .stream()
                .filter(t -> t.calculateStatus() != TestStatus.ENDED)
                .sorted(Comparator.comparing(Test::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        if (tests.isEmpty()) {
            return CertificateExamListResponse.empty();
        }

        boolean alreadyOwned = userId != null && userCertificateRepository
                .findByUserIdAndExamTypeIdAndStatus(userId, examTypeId, UserCertificate.Status.ACTIVE)
                .isPresent();

        return CertificateExamListResponse.builder()
                .tests(summaryAssembler.buildUserTestSummariesBatch(tests, userId))
                .certificateTitle(template.getTitle())
                .passScore(template.getPassScore())
                .validMonths(template.getValidMonths())
                .alreadyOwned(alreadyOwned)
                .build();
    }

    public List<TestCollectionResponse> getTestCollectionsByExamType(String examTypeId) {
        Set<String> adminIds = adminUserProvider.adminUserIds();
        return questionCollectionRepository.findByExamTypeIdAndParentIdIsNull(examTypeId).stream()
                .map(folder -> {
                    long testCount = adminIds.isEmpty() ? 0L
                            : testRepository.countByClassIdIsNullAndCreatedByInAndCollectionIdIn(
                                    adminIds, collectionWithChildrenIds(folder.getCollectionId()));
                    return TestCollectionResponse.builder()
                            .collectionId(folder.getCollectionId())
                            .name(folder.getName())
                            .description(folder.getDescription())
                            .testCount(testCount)
                            .build();
                })
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    public PageResponse<TestResponse> getTestsByCollectionPaged(
            String collectionId, int page, int size, String userId) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 12 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Set<String> adminIds = adminUserProvider.adminUserIds();
        if (adminIds.isEmpty()) return PageResponse.empty(safePage, safeSize);

        Page<Test> testPage = testRepository.findByClassIdIsNullAndCreatedByInAndCollectionIdIn(
                adminIds, collectionWithChildrenIds(collectionId), pageable);
        return summaryAssembler.toTestPageResponse(testPage, userId);
    }

    public List<TestAdminResponse> getAllTestsByAdmin() {
        Set<String> adminIds = adminUserProvider.adminUserIds();
        if (adminIds.isEmpty()) return new ArrayList<>();

        List<Test> result = testRepository.findByCreatedByIn(adminIds);
        return summaryAssembler.buildAdminTestSummariesBatch(result);
    }

    public List<TestAdminResponse> getAllTestsByAdminAndExamType(String examTypeId) {
        Set<String> adminIds = adminUserProvider.adminUserIds();
        if (adminIds.isEmpty()) return new ArrayList<>();

        List<Test> result = testRepository.findByExamTypeIdAndCreatedByIn(examTypeId, adminIds);
        return summaryAssembler.buildAdminTestSummariesBatch(result);
    }

    public List<TestAdminResponse> getAdminTestsByCreatedUser(String userId) {
        if (userId == null) {
            return List.of();
        }
        return summaryAssembler.buildAdminTestSummariesBatch(testRepository.findByCreatedBy(userId));
    }

    private QuickChallengeCardResponse buildQuickChallengeCard(
            Test test,
            ExamType examType,
            List<TestPart> testParts,
            Map<String, ExamPart> examPartMap,
            Map<String, String> skillNames) {

        Map<String, int[]> agg = new LinkedHashMap<>();
        Map<String, String> skillKeyIds = new HashMap<>();
        Map<String, String> partNames = new HashMap<>();

        for (TestPart tp : testParts) {
            ExamPart ep = examPartMap.get(tp.getExamPartId());
            int numQuestions = tp.getNumQuestions() != null ? tp.getNumQuestions() : 0;
            int order = (ep != null && ep.getDisplayOrder() != null) ? ep.getDisplayOrder() : 999;
            String skillId = ep != null ? ep.getSkillId() : null;

            String key;
            if (skillId != null) {
                key = "skill:" + skillId;
                skillKeyIds.put(key, skillId);
            } else {
                key = "part:" + tp.getExamPartId();
                partNames.put(key, (ep != null && ep.getName() != null) ? ep.getName() : "Phần thi");
            }

            int[] cur = agg.get(key);
            if (cur == null) {
                agg.put(key, new int[]{numQuestions, order});
            } else {
                cur[0] += numQuestions;
                cur[1] = Math.min(cur[1], order);
            }
        }

        List<QuickChallengeCardResponse.PartSummary> parts = agg.entrySet().stream()
                .map(e -> {
                    String key = e.getKey();
                    String name = skillKeyIds.containsKey(key)
                            ? skillNames.getOrDefault(skillKeyIds.get(key), "Kỹ năng")
                            : partNames.getOrDefault(key, "Phần thi");
                    return testMapper.toPartSummary(name, e.getValue()[0], e.getValue()[1]);
                })
                .sorted(Comparator.comparingInt(QuickChallengeCardResponse.PartSummary::getDisplayOrder))
                .toList();

        int totalQuestions = parts.stream()
                .mapToInt(QuickChallengeCardResponse.PartSummary::getNumQuestions)
                .sum();

        return testMapper.toQuickChallengeCard(
                test,
                examType != null ? examType.getName() : null,
                examType != null ? examType.getImageUrl() : null,
                test.calculateStatus().name(), totalQuestions, parts);
    }

    private boolean hasActiveCertificateTemplate(String examTypeId) {
        return certificateTemplateRepository.findByExamTypeId(examTypeId)
                .filter(t -> Boolean.TRUE.equals(t.getActive()))
                .isPresent();
    }

    private Set<String> certificateCategoryIds() {
        return examCategoryRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getCertificateEligible()))
                .map(ExamCategory::getExamCategoryId)
                .collect(Collectors.toSet());
    }

    private Set<String> collectionWithChildrenIds(String collectionId) {
        Set<String> ids = new HashSet<>();
        ids.add(collectionId);
        questionCollectionRepository.findByParentId(collectionId)
                .forEach(c -> ids.add(c.getCollectionId()));
        return ids;
    }
}
