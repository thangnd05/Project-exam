package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.domain.QuestionTag;
import com.project_exam.backend.modules.assessment.exam.dto.TagRequest;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.exam.mapper.TagMapper;
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
    private final TagMapper tagMapper;

    // ==================== CRUD ====================

    public TagResponse createTag(TagRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Tên tag không được để trống.");
        }
        if (request.getExamTypeId() == null) {
            throw new BadRequestException("examTypeId không được để trống.");
        }
        examTypeRepository.findById(request.getExamTypeId())
                .orElseThrow(() -> new NotFoundException("ExamType không tồn tại: " + request.getExamTypeId()));

        if (request.getParentId() != null) {
            Tag parent = tagRepository.findById(request.getParentId())
                    .orElseThrow(() -> new NotFoundException("Tag cha không tồn tại: " + request.getParentId()));
            if (!parent.getExamTypeId().equals(request.getExamTypeId())) {
                throw new BadRequestException("Tag cha phải cùng examTypeId.");
            }
        }

        Tag tag = new Tag();
        tag.setName(request.getName().trim());
        tag.setExamTypeId(request.getExamTypeId());
        tag.setParentId(normalizeParentId(request.getParentId()));
        tag.setSortOrder(request.getSortOrder());
        tag = tagRepository.save(tag);

        return toResponse(tag, List.of());
    }

    public TagResponse updateTag(String tagId, TagRequest request) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new NotFoundException("Tag không tồn tại: " + tagId));

        if (request.getName() != null && !request.getName().isBlank()) {
            tag.setName(request.getName().trim());
        }
        if (request.getParentId() != null) {
            if (request.getParentId().equals(tagId)) {
                throw new BadRequestException("Tag không thể là cha của chính nó.");
            }
            Tag parent = tagRepository.findById(request.getParentId())
                    .orElseThrow(() -> new NotFoundException("Tag cha không tồn tại: " + request.getParentId()));
            if (!parent.getExamTypeId().equals(tag.getExamTypeId())) {
                throw new BadRequestException("Tag cha phải cùng examTypeId.");
            }
            tag.setParentId(normalizeParentId(request.getParentId()));
        }
        // Set thẳng (không guard null) để admin có thể xoá thứ tự về "chưa xếp".
        tag.setSortOrder(request.getSortOrder());

        tag = tagRepository.save(tag);
        List<TagResponse> children = buildChildren(tag.getTagId(), tagRepository.findByExamTypeIdOrderBySortOrderAsc(tag.getExamTypeId()));
        return toResponse(tag, children);
    }

    @Transactional
    public void deleteTag(String tagId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new NotFoundException("Tag không tồn tại: " + tagId));

        // Xoá cascade: tất cả tag con + question_tags liên quan
        deleteTagRecursive(tagId);
    }

    private void deleteTagRecursive(String tagId) {
        List<Tag> children = tagRepository.findByParentId(tagId);
        for (Tag child : children) {
            deleteTagRecursive(child.getTagId());
        }
        questionTagRepository.deleteByTagId(tagId);
        resourceTagRepository.deleteByTagId(tagId);
        tagRepository.deleteById(tagId);
    }

    // ==================== QUERY ====================

    /**
     * Lấy danh sách tag theo examTypeId dạng cây (tree).
     */
    public List<TagResponse> getTagTreeByExamType(String examTypeId) {
        // 1 query: lấy hết tag đã sắp theo sortOrder. Root = tag không có parent, lọc tại chỗ
        // (bao gồm cả tag cũ parent_id = ''). buildChildren chỉ .filter() nên con giữ đúng thứ tự.
        List<Tag> allTags = tagRepository.findByExamTypeIdOrderBySortOrderAsc(examTypeId);
        return allTags.stream()
                .filter(t -> t.getParentId() == null || t.getParentId().isBlank())
                .map(t -> toResponse(t, buildChildren(t.getTagId(), allTags)))
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách tag phẳng (flat) theo examTypeId.
     */
    public List<TagResponse> getTagsFlatByExamType(String examTypeId) {
        return tagRepository.findByExamTypeId(examTypeId).stream()
                .map(t -> toResponse(t, null))
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách tag của một question.
     */
    public List<TagResponse> getTagsByQuestionId(String questionId) {
        List<QuestionTag> questionTags = questionTagRepository.findByQuestionId(questionId);
        return questionTags.stream()
                .map(qt -> tagRepository.findById(qt.getTagId()).orElse(null))
                .filter(Objects::nonNull)
                .map(t -> toResponse(t, null))
                .collect(Collectors.toList());
    }

    // ==================== QUESTION-TAG LINKING ====================

    /**
     * Gắn tags cho câu hỏi. Xoá hết tag cũ rồi gắn lại.
     */
    @Transactional
    public void syncQuestionTags(String questionId, List<String> tagIds) {
        questionTagRepository.deleteByQuestionId(questionId);
        if (tagIds == null || tagIds.isEmpty()) return;

        for (String tagId : tagIds) {
            tagRepository.findById(tagId)
                    .orElseThrow(() -> new NotFoundException("Tag không tồn tại: " + tagId));
            QuestionTag qt = new QuestionTag();
            qt.setQuestionId(questionId);
            qt.setTagId(tagId);
            questionTagRepository.save(qt);
        }
    }

    /**
     * Resolve danh sách SPEC tag (đọc từ dòng "Tags:" trong file import) -> tagId,
     * trong phạm vi 1 examType. Mỗi spec là 1 phần tử (đã tách theo ';' ở parser).
     *
     * <p>Cú pháp mỗi spec:</p>
     * <ul>
     *   <li>{@code "Cha > Con"} — chỉ rõ tag cha, khớp CHÍNH XÁC con thuộc cha đó.
     *       Dùng khi tên con trùng ở nhiều cha (vd "danh tính người nói" có ở Part 3 lẫn Part 4).</li>
     *   <li>{@code "Con"} — không ghi cha, thứ tự ưu tiên:
     *     (1) con thuộc cha = Part đang import; (2) chính tag Part đó; (3) nếu tên chỉ có DUY NHẤT
     *     1 tag thì lấy; (4) trùng nhiều cha mà không xác định được -> BỎ QUA (log warn).</li>
     * </ul>
     * Tên tag có thể chứa dấu phẩy (vd "Chủ đề, mục đích") — KHÔNG tách theo ','.
     * CHỈ khớp tag CÓ SẴN, không tự tạo tag mới. Tên/cha không khớp -> bỏ qua (log warn).
     */
    public List<String> resolveTagIdsByNames(Collection<String> specs, String examTypeId, String partTagName) {
        if (specs == null || specs.isEmpty() || examTypeId == null) {
            return List.of();
        }
        List<Tag> all = tagRepository.findByExamTypeId(examTypeId);
        Map<String, Tag> idToTag = new HashMap<>();
        for (Tag t : all) idToTag.put(t.getTagId(), t);

        // Tag root tương ứng Part đang import (vd "Part 3")
        String partRootId = null;
        if (partTagName != null && !partTagName.isBlank()) {
            for (Tag t : all) {
                boolean isRoot = t.getParentId() == null || t.getParentId().isBlank();
                if (isRoot && equalsName(t, partTagName)) { partRootId = t.getTagId(); break; }
            }
        }

        Map<String, List<Tag>> byName = new HashMap<>();
        for (Tag t : all) {
            if (t.getName() != null) {
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

            // Tách "Cha > Con" (chỉ ở dấu '>' đầu tiên)
            String parentName = null;
            String childName = spec;
            int gt = spec.indexOf('>');
            if (gt >= 0) {
                parentName = spec.substring(0, gt).trim();
                childName = spec.substring(gt + 1).trim();
            }
            if (childName.isEmpty()) { unmatched.add(spec); continue; }

            List<Tag> cands = byName.get(childName.toLowerCase(Locale.ROOT));
            if (cands == null || cands.isEmpty()) { unmatched.add(spec); continue; }

            Tag chosen = null;
            if (parentName != null && !parentName.isEmpty()) {
                // Khớp đúng con thuộc cha ghi rõ
                final String pn = parentName;
                for (Tag t : cands) {
                    Tag p = (t.getParentId() == null) ? null : idToTag.get(t.getParentId());
                    if (p != null && equalsName(p, pn)) { chosen = t; break; }
                }
                if (chosen == null) { unmatched.add(spec); continue; }
            } else {
                // Không ghi cha -> suy theo Part đang import
                if (partRootId != null) {
                    for (Tag t : cands) if (partRootId.equals(t.getParentId())) { chosen = t; break; }
                    if (chosen == null) for (Tag t : cands) if (partRootId.equals(t.getTagId())) { chosen = t; break; }
                }
                if (chosen == null) {
                    if (cands.size() == 1) chosen = cands.get(0);
                    else { ambiguous.add(spec); continue; }
                }
            }
            if (!ids.contains(chosen.getTagId())) ids.add(chosen.getTagId());
        }
        if (!unmatched.isEmpty()) {
            log.warn("Import tags: bỏ qua {} spec không khớp tag có sẵn (examType={}): {}",
                    unmatched.size(), examTypeId, unmatched);
        }
        if (!ambiguous.isEmpty()) {
            log.warn("Import tags: bỏ qua {} tag trùng tên nhiều cha, chưa ghi 'Cha > Con' & không thuộc Part '{}': {}",
                    ambiguous.size(), partTagName, ambiguous);
        }
        return ids;
    }

    private boolean equalsName(Tag t, String name) {
        return t.getName() != null && name != null
                && t.getName().trim().equalsIgnoreCase(name.trim());
    }

    // ==================== HELPERS ====================

    private List<TagResponse> buildChildren(String parentId, List<Tag> allTags) {
        return allTags.stream()
                .filter(t -> parentId != null && parentId.equals(t.getParentId()))
                .map(t -> toResponse(t, buildChildren(t.getTagId(), allTags)))
                .collect(Collectors.toList());
    }

    private String normalizeParentId(String parentId) {
        if (parentId == null || parentId.isBlank()) {
            return null;
        }
        return parentId.trim();
    }

    private TagResponse toResponse(Tag tag, List<TagResponse> children) {
        return tagMapper.toResponse(tag, children);
    }

}
