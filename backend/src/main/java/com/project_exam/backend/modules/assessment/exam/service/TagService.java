package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.domain.QuestionTag;
import com.project_exam.backend.modules.assessment.exam.dto.TagRequest;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.TagMapper;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ResourceTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final QuestionTagRepository questionTagRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ExamPartRepository examPartRepository;
    private final QuestionRepository questionRepository;
    private final TagMapper tagMapper;

    public TagResponse createTag(TagRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Tên tag không được để trống.");
        }
        if (request.getExamTypeId() == null) {
            throw new BadRequestException("examTypeId không được để trống.");
        }
        examTypeRepository.findById(request.getExamTypeId())
                .orElseThrow(() -> new NotFoundException("ExamType không tồn tại: " + request.getExamTypeId()));

        Tag tag = new Tag();
        tag.setName(request.getName().trim());
        tag.setExamTypeId(request.getExamTypeId());
        tag.setExamPartId(requireExamPartOfType(request.getExamPartId(), request.getExamTypeId()));
        tag.setSortOrder(request.getSortOrder());
        tag = tagRepository.save(tag);

        return toResponse(tag, partNamesOf(tag.getExamTypeId()));
    }

    public TagResponse updateTag(String tagId, TagRequest request) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new NotFoundException("Tag không tồn tại: " + tagId));

        if (request.getName() != null && !request.getName().isBlank()) {
            tag.setName(request.getName().trim());
        }

        String examPartId = requireExamPartOfType(request.getExamPartId(), tag.getExamTypeId());
        if (examPartId != null && !examPartId.equals(tag.getExamPartId())) {
            long conflicts = questionTagRepository.countLinksOutsideExamPart(List.of(tagId), examPartId);
            if (conflicts > 0) {
                throw new BadRequestException("Tag đang gắn với " + conflicts
                        + " câu hỏi thuộc phần thi khác, không thể chuyển phần thi.");
            }
        }
        tag.setExamPartId(examPartId);
        tag.setSortOrder(request.getSortOrder());
        tag = tagRepository.save(tag);

        return toResponse(tag, partNamesOf(tag.getExamTypeId()));
    }

    @Transactional
    public void deleteTag(String tagId) {
        tagRepository.findById(tagId)
                .orElseThrow(() -> new NotFoundException("Tag không tồn tại: " + tagId));

        questionTagRepository.deleteByTagId(tagId);
        resourceTagRepository.deleteByTagId(tagId);
        tagRepository.deleteById(tagId);
    }

    /** Sắp theo thứ tự phần thi (tag dùng chung cuối cùng), trong mỗi phần thi theo sortOrder. */
    public List<TagResponse> getTagsFlatByExamType(String examTypeId) {
        List<ExamPart> parts = examPartRepository.findByExamTypeId(examTypeId);
        Map<String, Integer> partRank = new HashMap<>();
        for (int i = 0; i < parts.size(); i++) partRank.put(parts.get(i).getExamPartId(), i);
        Map<String, String> partNames = partNamesOf(parts);

        Map<String, Long> resourceCounts = new HashMap<>();
        for (Object[] row : resourceTagRepository.countByTagForExamType(examTypeId)) {
            resourceCounts.put((String) row[0], (Long) row[1]);
        }

        List<Tag> tags = new ArrayList<>(tagRepository.findByExamTypeIdOrderBySortOrderAsc(examTypeId));
        tags.sort(Comparator.comparingInt(t -> partRank.getOrDefault(t.getExamPartId(), Integer.MAX_VALUE)));
        return tags.stream()
                .map(t -> tagMapper.toResponse(t,
                        t.getExamPartId() == null ? null : partNames.get(t.getExamPartId()),
                        resourceCounts.getOrDefault(t.getTagId(), 0L)))
                .collect(Collectors.toList());
    }

    public List<TagResponse> getTagsByQuestionId(String questionId) {
        List<QuestionTag> questionTags = questionTagRepository.findByQuestionId(questionId);
        return questionTags.stream()
                .map(qt -> tagRepository.findById(qt.getTagId()).orElse(null))
                .filter(Objects::nonNull)
                .map(tagMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void syncQuestionTags(String questionId, List<String> tagIds) {
        questionTagRepository.deleteByQuestionId(questionId);
        if (tagIds == null || tagIds.isEmpty()) return;

        String questionPartId = questionRepository.findById(questionId)
                .map(Question::getExamPartId)
                .orElse(null);
        for (String tagId : new LinkedHashSet<>(tagIds)) {
            Tag tag = tagRepository.findById(tagId)
                    .orElseThrow(() -> new NotFoundException("Tag không tồn tại: " + tagId));
            if (!isAllowedForPart(tag, questionPartId)) {
                throw new BadRequestException("Tag \"" + tag.getName() + "\" thuộc phần thi khác với câu hỏi.");
            }
            QuestionTag qt = new QuestionTag();
            qt.setQuestionId(questionId);
            qt.setTagId(tagId);
            questionTagRepository.save(qt);
        }
    }

    /** Bỏ các tag không thuộc phần thi của câu hỏi (dùng cho import, không báo lỗi). */
    public List<String> filterTagIdsForExamPart(Collection<String> tagIds, String examPartId) {
        if (tagIds == null || tagIds.isEmpty()) return List.of();
        Map<String, Tag> byId = tagRepository.findAllById(tagIds).stream()
                .collect(Collectors.toMap(Tag::getTagId, t -> t));
        List<String> kept = new ArrayList<>();
        List<String> dropped = new ArrayList<>();
        for (String id : tagIds) {
            Tag t = byId.get(id);
            if (t == null) continue;
            if (isAllowedForPart(t, examPartId)) kept.add(id);
            else dropped.add(t.getName());
        }
        if (!dropped.isEmpty()) {
            log.warn("Import tags: bỏ qua {} tag không thuộc phần thi {}: {}", dropped.size(), examPartId, dropped);
        }
        return kept;
    }

    /**
     * Resolve tag theo tên. Spec dạng "Tag" hoặc "Phần thi > Tag".
     * Chỉ xét tag dùng chung hoặc thuộc đúng phần thi {@code examPartId}; ưu tiên tag của phần thi.
     */
    public List<String> resolveTagIdsByNames(Collection<String> specs, String examTypeId, String examPartId) {
        TagNameResolution resolution = resolveTagNames(specs, examTypeId, examPartId);
        if (!resolution.unmatched().isEmpty()) {
            log.warn("Import tags: bỏ qua {} spec không khớp tag có sẵn (examType={}, examPart={}): {}",
                    resolution.unmatched().size(), examTypeId, examPartId, resolution.unmatched());
        }
        if (!resolution.ambiguous().isEmpty()) {
            log.warn("Import tags: bỏ qua {} tag trùng tên (examPart={}): {}",
                    resolution.ambiguous().size(), examPartId, resolution.ambiguous());
        }
        return resolution.ids();
    }

    /** Kết quả resolve tag theo tên, kèm các spec không khớp hoặc trùng tên để báo cho người dùng. */
    public record TagNameResolution(List<String> ids, List<String> unmatched, List<String> ambiguous) {
    }

    public TagNameResolution resolveTagNames(Collection<String> specs, String examTypeId, String examPartId) {
        if (specs == null || specs.isEmpty() || examTypeId == null) {
            return new TagNameResolution(List.of(), List.of(), List.of());
        }
        return resolveAgainst(specs, tagRepository.findByExamTypeId(examTypeId), partNamesOf(examTypeId), examPartId);
    }

    /**
     * Bộ tra tag cho cả một lượt import: tải tag và tên phần thi của kỳ thi đúng một lần, thay vì
     * mỗi câu một lần. Mỗi truy vấn giữa chừng transaction còn bắt Hibernate flush và dò toàn bộ
     * entity đang giữ, nên import nghìn câu mà tra lại từng câu sẽ chậm theo bình phương.
     */
    public ImportTagResolver importTagResolver(String examTypeId) {
        if (examTypeId == null) {
            return new ImportTagResolver(List.of(), Map.of());
        }
        return new ImportTagResolver(tagRepository.findByExamTypeId(examTypeId), partNamesOf(examTypeId));
    }

    public final class ImportTagResolver {
        private final List<Tag> tags;
        private final Map<String, String> partNames;
        private final Map<String, Tag> byId = new HashMap<>();

        private ImportTagResolver(List<Tag> tags, Map<String, String> partNames) {
            this.tags = tags;
            this.partNames = partNames;
            tags.forEach(t -> byId.put(t.getTagId(), t));
        }

        /** Tag hợp lệ cho một câu thuộc {@code examPartId}; tag của phần thi khác bị bỏ, như filterTagIdsForExamPart. */
        public List<Tag> resolve(String examPartId, Collection<String> tagIds, Collection<String> tagNames) {
            List<String> ids = new ArrayList<>();
            if (tagIds != null) {
                tagIds.stream().filter(Objects::nonNull).forEach(ids::add);
            }
            if (examPartId != null && tagNames != null && !tagNames.isEmpty()) {
                TagNameResolution resolution = resolveAgainst(tagNames, tags, partNames, examPartId);
                if (!resolution.unmatched().isEmpty()) {
                    log.warn("Import tags: bỏ qua {} spec không khớp tag có sẵn (examPart={}): {}",
                            resolution.unmatched().size(), examPartId, resolution.unmatched());
                }
                if (!resolution.ambiguous().isEmpty()) {
                    log.warn("Import tags: bỏ qua {} tag trùng tên (examPart={}): {}",
                            resolution.ambiguous().size(), examPartId, resolution.ambiguous());
                }
                ids.addAll(resolution.ids());
            }
            if (ids.isEmpty()) {
                return List.of();
            }
            // tagIds khai báo trực tiếp có thể thuộc kỳ thi khác (tag dùng chung): tra bổ sung một lần.
            List<String> unknown = ids.stream().filter(id -> !byId.containsKey(id)).distinct().toList();
            if (!unknown.isEmpty()) {
                tagRepository.findAllById(unknown).forEach(t -> byId.put(t.getTagId(), t));
            }

            List<Tag> kept = new ArrayList<>();
            List<String> dropped = new ArrayList<>();
            for (String id : new LinkedHashSet<>(ids)) {
                Tag t = byId.get(id);
                if (t == null) continue;
                if (isAllowedForPart(t, examPartId)) kept.add(t);
                else dropped.add(t.getName());
            }
            if (!dropped.isEmpty()) {
                log.warn("Import tags: bỏ qua {} tag không thuộc phần thi {}: {}", dropped.size(), examPartId, dropped);
            }
            return kept;
        }
    }

    /**
     * Gắn tag cho câu hỏi vừa tạo. Khác syncQuestionTags: không xoá tag cũ và không đọc lại câu
     * hay tag, vì câu mới chưa có tag và tag đã được {@link ImportTagResolver} kiểm tra phần thi.
     */
    public List<TagResponse> attachTagsToNewQuestion(String questionId, List<Tag> tags) {
        if (tags.isEmpty()) {
            return List.of();
        }
        List<QuestionTag> links = tags.stream().map(tag -> {
            QuestionTag qt = new QuestionTag();
            qt.setQuestionId(questionId);
            qt.setTagId(tag.getTagId());
            return qt;
        }).toList();
        questionTagRepository.saveAll(links);
        return tags.stream().map(tagMapper::toResponse).collect(Collectors.toList());
    }

    private TagNameResolution resolveAgainst(
            Collection<String> specs, List<Tag> allTags, Map<String, String> partNames, String examPartId) {
        if (specs == null || specs.isEmpty()) {
            return new TagNameResolution(List.of(), List.of(), List.of());
        }
        Map<String, List<Tag>> byName = new HashMap<>();
        for (Tag t : allTags) {
            if (t.getName() != null && isAllowedForPart(t, examPartId)) {
                byName.computeIfAbsent(t.getName().trim().toLowerCase(Locale.ROOT),
                        k -> new ArrayList<>()).add(t);
            }
        }

        List<String> ids = new ArrayList<>();
        List<String> unmatched = new ArrayList<>();
        List<String> ambiguous = new ArrayList<>();
        for (String rawSpec : specs) {
            if (rawSpec == null) continue;
            String spec = rawSpec.trim();
            if (spec.isEmpty()) continue;

            String partName = null;
            String tagName = spec;
            int gt = spec.indexOf('>');
            if (gt >= 0) {
                partName = spec.substring(0, gt).trim();
                tagName = spec.substring(gt + 1).trim();
            }
            if (tagName.isEmpty()) { unmatched.add(spec); continue; }

            List<Tag> cands = byName.getOrDefault(tagName.toLowerCase(Locale.ROOT), List.of());
            if (partName != null && !partName.isEmpty()) {
                final String pn = partName;
                cands = cands.stream().filter(t -> equalsName(partNames.get(t.getExamPartId()), pn)).toList();
            }
            if (cands.isEmpty()) { unmatched.add(spec); continue; }

            Tag chosen = null;
            if (cands.size() > 1 && examPartId != null) {
                List<Tag> inPart = cands.stream().filter(t -> examPartId.equals(t.getExamPartId())).toList();
                if (inPart.size() == 1) chosen = inPart.get(0);
            }
            if (chosen == null) {
                if (cands.size() == 1) chosen = cands.get(0);
                else { ambiguous.add(spec); continue; }
            }
            if (!ids.contains(chosen.getTagId())) ids.add(chosen.getTagId());
        }
        return new TagNameResolution(ids, unmatched, ambiguous);
    }

    private boolean isAllowedForPart(Tag tag, String examPartId) {
        return tag.getExamPartId() == null || tag.getExamPartId().equals(examPartId);
    }

    private boolean equalsName(String a, String b) {
        return a != null && b != null && a.trim().equalsIgnoreCase(b.trim());
    }

    private String requireExamPartOfType(String rawExamPartId, String examTypeId) {
        if (rawExamPartId == null || rawExamPartId.isBlank()) return null;
        String examPartId = rawExamPartId.trim();
        ExamPart part = examPartRepository.findById(examPartId)
                .orElseThrow(() -> new NotFoundException("Phần thi không tồn tại: " + examPartId));
        if (!examTypeId.equals(part.getExamTypeId())) {
            throw new BadRequestException("Phần thi phải thuộc cùng loại kỳ thi với tag.");
        }
        return examPartId;
    }

    private Map<String, String> partNamesOf(String examTypeId) {
        return partNamesOf(examPartRepository.findByExamTypeId(examTypeId));
    }

    private Map<String, String> partNamesOf(List<ExamPart> parts) {
        Map<String, String> names = new HashMap<>();
        for (ExamPart p : parts) names.put(p.getExamPartId(), p.getName());
        return names;
    }

    private TagResponse toResponse(Tag tag, Map<String, String> partNames) {
        String partName = tag.getExamPartId() == null ? null : partNames.get(tag.getExamPartId());
        return tagMapper.toResponse(tag, partName);
    }

}
