package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.Tag;
import com.project_exam.backend.modules.assessment.exam.domain.QuestionTag;
import com.project_exam.backend.modules.assessment.exam.dto.TagRequest;
import com.project_exam.backend.modules.assessment.exam.dto.TagResponse;
import com.project_exam.backend.modules.assessment.exam.repository.TagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ResourceTagRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamTypeRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final QuestionTagRepository questionTagRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final ExamTypeRepository examTypeRepository;

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

        tag = tagRepository.save(tag);
        List<TagResponse> children = buildChildren(tag.getTagId(), tagRepository.findByExamTypeId(tag.getExamTypeId()));
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
        List<Tag> allTags = tagRepository.findByExamTypeId(examTypeId);
        List<Tag> rootTags = tagRepository.findByExamTypeIdAndParentIdIsNull(examTypeId);
        // Fallback: tag cũ có parent_id = '' vẫn coi là root
        if (rootTags.isEmpty()) {
            rootTags = allTags.stream()
                    .filter(t -> t.getParentId() == null || t.getParentId().isBlank())
                    .toList();
        }
        return rootTags.stream()
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
        return TagResponse.builder()
                .tagId(tag.getTagId())
                .name(tag.getName())
                .examTypeId(tag.getExamTypeId())
                .parentId(tag.getParentId())
                .children(children)
                .build();
    }

}
