package com.project_exam.backend.modules.assessment.learning.service;

import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.domain.ResourceTag;
import com.project_exam.backend.modules.assessment.exam.repository.RecoveryResourceRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ResourceTagRepository;
import com.project_exam.backend.modules.assessment.learning.dto.RecommendedResourceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LearningPlanResourceLookup {

    private final ResourceTagRepository resourceTagRepository;
    private final RecoveryResourceRepository recoveryResourceRepository;

    public Optional<RecommendedResourceResponse> findFirstByTagId(String tagId) {
        if (tagId == null || tagId.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(findFirstByTagIds(List.of(tagId)).get(tagId));
    }

    public Map<String, RecommendedResourceResponse> findFirstByTagIds(Collection<String> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Map.of();
        }
        List<String> distinctTagIds = tagIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctTagIds.isEmpty()) {
            return Map.of();
        }

        List<ResourceTag> links = resourceTagRepository.findByTagIdIn(distinctTagIds);
        if (links.isEmpty()) {
            return Map.of();
        }
        Set<String> resourceIds = links.stream().map(ResourceTag::getResourceId).collect(Collectors.toSet());
        // Tài liệu tạo sớm nhất của mỗi tag được chọn, để kết quả ổn định giữa các lần gọi.
        Map<String, Integer> rankById = new HashMap<>();
        List<RecoveryResource> ordered = recoveryResourceRepository.findByResourceIdInOrderByCreatedAtAscTitleAsc(resourceIds);
        for (int i = 0; i < ordered.size(); i++) rankById.put(ordered.get(i).getResourceId(), i);

        Map<String, RecoveryResource> firstByTag = new HashMap<>();
        for (ResourceTag link : links) {
            Integer rank = rankById.get(link.getResourceId());
            if (rank == null) continue;
            RecoveryResource current = firstByTag.get(link.getTagId());
            if (current == null || rank < rankById.get(current.getResourceId())) {
                firstByTag.put(link.getTagId(), ordered.get(rank));
            }
        }

        Map<String, RecommendedResourceResponse> result = new HashMap<>();
        firstByTag.forEach((tagId, r) -> result.put(tagId, toDto(r)));
        return result;
    }

    /** Tài liệu của mỗi phần thi = tài liệu có ít nhất một tag thuộc phần thi đó. */
    public Map<String, List<RecommendedResourceResponse>> findByExamPartIds(Collection<String> examPartIds) {
        if (examPartIds == null || examPartIds.isEmpty()) {
            return Map.of();
        }
        List<String> distinctPartIds = examPartIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctPartIds.isEmpty()) {
            return Map.of();
        }
        // partId -> (resourceId -> sortOrder nhỏ nhất của tag thuộc part đó)
        Map<String, Map<String, Integer>> rankByPart = new HashMap<>();
        for (Object[] row : resourceTagRepository.findResourcePartPairs(distinctPartIds)) {
            int sortOrder = row[2] != null ? (Integer) row[2] : Integer.MAX_VALUE;
            rankByPart.computeIfAbsent((String) row[1], k -> new HashMap<>())
                    .merge((String) row[0], sortOrder, Math::min);
        }
        if (rankByPart.isEmpty()) {
            return Map.of();
        }
        Set<String> resourceIds = rankByPart.values().stream()
                .flatMap(m -> m.keySet().stream())
                .collect(Collectors.toSet());
        Map<String, RecoveryResource> resourceById = recoveryResourceRepository.findAllById(resourceIds).stream()
                .collect(Collectors.toMap(RecoveryResource::getResourceId, r -> r));

        // Trong mỗi phần thi, xếp theo thứ tự tag rồi tiêu đề.
        Map<String, List<RecommendedResourceResponse>> result = new LinkedHashMap<>();
        rankByPart.forEach((partId, ranks) -> result.put(partId, ranks.keySet().stream()
                .map(resourceById::get)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing((RecoveryResource r) -> ranks.get(r.getResourceId()))
                        .thenComparing(RecoveryResource::getTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(this::toDto)
                .toList()));
        return result;
    }

    public RecommendedResourceResponse toDto(RecoveryResource r) {
        return RecommendedResourceResponse.builder()
                .resourceId(r.getResourceId())
                .title(r.getTitle())
                .description(r.getDescription())
                .url(r.getUrl())
                .originalFileName(r.getOriginalFileName())
                .build();
    }
}
