package com.project_exam.backend.modules.assessment.learning.service;

import com.project_exam.backend.modules.assessment.exam.domain.RecoveryResource;
import com.project_exam.backend.modules.assessment.exam.domain.ResourceTag;
import com.project_exam.backend.modules.assessment.exam.repository.RecoveryResourceRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ResourceTagRepository;
import com.project_exam.backend.modules.assessment.learning.dto.PlanPhaseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/** Tài liệu ôn (RecoveryResource) gắn tag — dùng trước khi luyện ải. */
@Component
@RequiredArgsConstructor
public class LearningPlanResourceLookup {

    private final ResourceTagRepository resourceTagRepository;
    private final RecoveryResourceRepository recoveryResourceRepository;

    public Optional<PlanPhaseDto.RecommendedResourceDto> findFirstByTagId(String tagId) {
        if (tagId == null || tagId.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(findFirstByTagIds(List.of(tagId)).get(tagId));
    }

    /**
     * Mỗi tagId tài liệu đầu tiên (theo thứ tự resource_tag).
     */
    public Map<String, PlanPhaseDto.RecommendedResourceDto> findFirstByTagIds(Collection<String> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Map.of();
        }
        List<String> distinctTagIds = tagIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctTagIds.isEmpty()) {
            return Map.of();
        }

        List<ResourceTag> links = resourceTagRepository.findByTagIdIn(distinctTagIds);
        Map<String, String> tagToResourceId = new LinkedHashMap<>();
        for (ResourceTag link : links) {
            tagToResourceId.putIfAbsent(link.getTagId(), link.getResourceId());
        }
        if (tagToResourceId.isEmpty()) {
            return Map.of();
        }

        Set<String> resourceIds = new HashSet<>(tagToResourceId.values());
        Map<String, RecoveryResource> resourceById = recoveryResourceRepository.findAllById(resourceIds)
                .stream()
                .collect(Collectors.toMap(RecoveryResource::getResourceId, r -> r, (a, b) -> a));

        Map<String, PlanPhaseDto.RecommendedResourceDto> result = new HashMap<>();
        for (Map.Entry<String, String> entry : tagToResourceId.entrySet()) {
            RecoveryResource r = resourceById.get(entry.getValue());
            if (r != null) {
                result.put(entry.getKey(), toDto(r));
            }
        }
        return result;
    }

    /**
     * Tài liệu gắn Part (giới thiệu/cách làm Part) theo từng examPartId —
     * hiển thị đầu nhóm Part trong kế hoạch, trước tài liệu theo tag.
     */
    public Map<String, List<PlanPhaseDto.RecommendedResourceDto>> findByExamPartIds(Collection<String> examPartIds) {
        if (examPartIds == null || examPartIds.isEmpty()) {
            return Map.of();
        }
        List<String> distinctPartIds = examPartIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctPartIds.isEmpty()) {
            return Map.of();
        }
        return recoveryResourceRepository.findByExamPartIdInOrderByCreatedAtAsc(distinctPartIds).stream()
                .collect(Collectors.groupingBy(
                        RecoveryResource::getExamPartId,
                        LinkedHashMap::new,
                        Collectors.mapping(this::toDto, Collectors.toList())));
    }

    public PlanPhaseDto.RecommendedResourceDto toDto(RecoveryResource r) {
        return PlanPhaseDto.RecommendedResourceDto.builder()
                .resourceId(r.getResourceId())
                .title(r.getTitle())
                .description(r.getDescription())
                .url(r.getUrl())
                .originalFileName(r.getOriginalFileName())
                .build();
    }
}
