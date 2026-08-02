package com.project_exam.backend.modules.assessment.learning.support;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.modules.assessment.learning.domain.LearningPlanTask;
import com.project_exam.backend.modules.assessment.learning.domain.PlanTaskType;
import com.project_exam.backend.modules.assessment.learning.dto.PlanPartGroupResponse;
import com.project_exam.backend.modules.assessment.learning.dto.RecommendedResourceResponse;
import com.project_exam.backend.modules.assessment.learning.dto.PlanTaskResponse;
import com.project_exam.backend.modules.assessment.learning.mapper.LearningMapper;
import com.project_exam.backend.modules.assessment.learning.service.LearningPlanResourceLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PlanTaskViewAssembler {

    private final TagRepository tagRepository;
    private final ExamPartRepository examPartRepository;
    private final LearningPlanResourceLookup resourceLookup;
    private final LearningMapper learningMapper;

    public record Lookups(
            Map<String, Tag> tagsById,
            Map<String, ExamPart> partsById,
            Map<String, RecommendedResourceResponse> resourcesByTag,
            Map<String, List<RecommendedResourceResponse>> resourcesByPart) {

        public static Lookups empty() {
            return new Lookups(Map.of(), Map.of(), Map.of(), Map.of());
        }
    }

    public Lookups lookupsFor(List<LearningPlanTask> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Lookups.empty();
        }
        Set<String> tagIds = tasks.stream()
                .map(LearningPlanTask::getTagId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<String> partIds = tasks.stream()
                .map(LearningPlanTask::getExamPartId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Tag> tagsById = tagIds.isEmpty() ? Map.of()
                : tagRepository.findAllById(tagIds).stream()
                        .collect(Collectors.toMap(Tag::getTagId, t -> t, (a, b) -> a));
        Map<String, ExamPart> partsById = partIds.isEmpty() ? Map.of()
                : examPartRepository.findAllById(partIds).stream()
                        .collect(Collectors.toMap(ExamPart::getExamPartId, p -> p, (a, b) -> a));

        return new Lookups(
                tagsById,
                partsById,
                resourceLookup.findFirstByTagIds(tagIds),
                resourceLookup.findByExamPartIds(partIds));
    }

    public PlanTaskResponse toTaskDto(LearningPlanTask task, Lookups lookups) {
        PlanTaskType taskType = task.getTaskType() != null ? task.getTaskType() : PlanTaskType.TAG;
        Tag tag = task.getTagId() != null ? lookups.tagsById().get(task.getTagId()) : null;
        ExamPart part = task.getExamPartId() != null ? lookups.partsById().get(task.getExamPartId()) : null;
        RecommendedResourceResponse studyResource = task.getTagId() != null
                ? lookups.resourcesByTag().get(task.getTagId())
                : null;
        return learningMapper.toTaskDto(
                task,
                taskType.name(),
                tag != null ? tag.getName() : null,
                part != null ? part.getName() : null,
                studyResource);
    }

    public List<PlanPartGroupResponse> buildPartGroups(List<LearningPlanTask> tasks, Lookups lookups) {
        if (tasks == null || tasks.isEmpty()) {
            return List.of();
        }
        Map<String, List<LearningPlanTask>> byPart = tasks.stream()
                .collect(Collectors.groupingBy(
                        LearningPlanTask::getExamPartId,
                        LinkedHashMap::new,
                        Collectors.toList()));

        List<PlanPartGroupResponse> groups = new ArrayList<>();
        for (Map.Entry<String, List<LearningPlanTask>> entry : byPart.entrySet()) {
            String partId = entry.getKey();
            List<LearningPlanTask> partTasks = entry.getValue().stream()
                    .sorted(Comparator.comparingInt(PlanTaskViewAssembler::taskOrderOf))
                    .toList();
            ExamPart part = lookups.partsById().get(partId);
            int passedInPart = (int) partTasks.stream()
                    .filter(LearningPlanTaskUnlockSupport::isCleared)
                    .count();
            groups.add(learningMapper.toPartGroup(
                    partId,
                    part != null ? part.getName() : partId,
                    part != null ? part.getDisplayOrder() : null,
                    partTasks.isEmpty() ? null : partTasks.get(0).getPassAccuracy(),
                    passedInPart,
                    partTasks.size(),

                    lookups.resourcesByPart().getOrDefault(partId, List.of()),
                    partTasks.stream().map(t -> toTaskDto(t, lookups)).toList()));
        }
        groups.sort(Comparator.comparingInt(
                g -> g.getDisplayOrder() != null ? g.getDisplayOrder() : Integer.MAX_VALUE));
        return groups;
    }

    private static int taskOrderOf(LearningPlanTask task) {
        return task.getTaskOrder() != null ? task.getTaskOrder() : Integer.MAX_VALUE;
    }
}
