package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import com.project_exam.backend.modules.assessment.exam.domain.QuestionCollection;
import com.project_exam.backend.modules.assessment.exam.mapper.QuestionCollectionMapper;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionCollectionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestionCollectionService {

    private final QuestionCollectionRepository collectionRepository;
    private final QuestionRepository questionRepository;
    private final QuestionCollectionMapper questionCollectionMapper;

    public List<QuestionCollectionResponse> findAll() {

        Comparator<QuestionCollection> byOrderThenName = Comparator
                .comparing(QuestionCollection::getDisplayOrder,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(c -> c.getName() == null ? "" : c.getName(),
                        String.CASE_INSENSITIVE_ORDER);
        return collectionRepository.findAll().stream()
                .sorted(byOrderThenName)
                .map(this::toResponse)
                .toList();
    }

    public QuestionCollectionResponse findById(String id) {
        QuestionCollection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Bộ sưu tập câu hỏi không tồn tại"));
        return toResponse(collection);
    }

    @Transactional
    public QuestionCollectionResponse create(QuestionCollectionRequest request) {
        String name = normalize(request.getName());
        if (name == null) {
            throw new BadRequestException("Tên bộ sưu tập không được để trống.");
        }

        collectionRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            throw new ConflictException("Tên bộ sưu tập đã tồn tại.");
        });
        QuestionCollection collection = new QuestionCollection();
        collection.setName(name);
        collection.setDescription(trimOrNull(request.getDescription()));

        String parentId = resolveParentId(request.getParentId(), null);
        collection.setParentId(parentId);

        collection.setExamTypeId(resolveExamTypeId(parentId, request.getExamTypeId()));

        collection.setDisplayOrder(request.getDisplayOrder());
        collection = collectionRepository.save(collection);
        return toResponse(collection);
    }

    @Transactional
    public QuestionCollectionResponse update(String id, QuestionCollectionRequest request) {
        QuestionCollection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Bộ sưu tập câu hỏi không tồn tại"));

        if (request.getName() != null) {
            String newName = normalize(request.getName());
            if (newName == null) {
                throw new BadRequestException("Tên bộ sưu tập không được để trống.");
            }

            if (!newName.equalsIgnoreCase(collection.getName())) {
                Optional<QuestionCollection> dup = collectionRepository.findByNameIgnoreCase(newName);
                if (dup.isPresent() && !dup.get().getCollectionId().equals(id)) {
                    throw new ConflictException("Tên bộ sưu tập đã tồn tại.");
                }
            }
            collection.setName(newName);
        }

        if (request.getDescription() != null) {
            collection.setDescription(trimOrNull(request.getDescription()));
        }

        if (request.getParentId() != null) {
            collection.setParentId(resolveParentId(request.getParentId(), id));
        }

        if (collection.getParentId() != null) {

            collection.setExamTypeId(resolveExamTypeId(collection.getParentId(), null));
        } else if (request.getExamTypeId() != null) {

            String newExamTypeId = normalize(request.getExamTypeId());
            collection.setExamTypeId(newExamTypeId);
            List<QuestionCollection> children = collectionRepository.findByParentId(id);
            children.forEach(c -> c.setExamTypeId(newExamTypeId));
            if (!children.isEmpty()) collectionRepository.saveAll(children);
        }

        if (request.getDisplayOrder() != null) {
            collection.setDisplayOrder(request.getDisplayOrder());
        }

        collection = collectionRepository.save(collection);
        return toResponse(collection);
    }

    @Transactional
    public void delete(String id) {
        QuestionCollection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Bộ sưu tập câu hỏi không tồn tại"));

        long inUse = questionRepository.countByCollectionId(id);
        if (inUse > 0) {
            throw new ConflictException(
                    "Không thể xoá: bộ sưu tập đang có " + inUse + " câu hỏi. " +
                            "Hãy bỏ liên kết các câu hỏi trước khi xoá."
            );
        }

        long childCount = collectionRepository.countByParentId(id);
        if (childCount > 0) {
            throw new ConflictException(
                    "Không thể xoá: bộ sưu tập đang chứa " + childCount + " bộ sưu tập con. " +
                            "Hãy xoá hoặc tách các bộ sưu tập con trước."
            );
        }
        collectionRepository.delete(collection);
    }

    private QuestionCollectionResponse toResponse(QuestionCollection collection) {
        String id = collection.getCollectionId();

        Long questionCount = questionRepository.countByCollectionId(id);

        String parentName = null;
        if (collection.getParentId() != null) {
            parentName = collectionRepository.findById(collection.getParentId())
                    .map(QuestionCollection::getName)
                    .orElse(null);
        }

        List<QuestionCollection> children = collectionRepository.findByParentId(id);
        Long childCount = (long) children.size();
        Long totalQuestionCount = questionCount;
        if (!children.isEmpty()) {
            List<String> ids = new ArrayList<>();
            ids.add(id);
            children.forEach(c -> ids.add(c.getCollectionId()));
            totalQuestionCount = questionRepository.countByCollectionIdIn(ids);
        }

        return questionCollectionMapper.toResponse(
                collection, questionCount, parentName, childCount, totalQuestionCount);
    }

    private String resolveParentId(String rawParentId, String selfId) {
        String parentId = normalize(rawParentId);
        if (parentId == null) {
            return null;
        }
        if (parentId.equals(selfId)) {
            throw new BadRequestException("Bộ sưu tập không thể là cha của chính nó.");
        }
        QuestionCollection parent = collectionRepository.findById(parentId)
                .orElseThrow(() -> new BadRequestException("Bộ sưu tập cha không tồn tại."));
        if (parent.getParentId() != null) {
            throw new BadRequestException(
                    "Chỉ hỗ trợ 2 cấp: không thể chọn một bộ sưu tập con làm cha.");
        }
        if (selfId != null && collectionRepository.existsByParentId(selfId)) {
            throw new BadRequestException(
                    "Bộ sưu tập này đang chứa bộ sưu tập con nên không thể trở thành con của bộ khác.");
        }
        return parentId;
    }

    private String resolveExamTypeId(String parentId, String rawExamTypeId) {
        if (parentId == null) {
            return normalize(rawExamTypeId);
        }
        return collectionRepository.findById(parentId)
                .map(QuestionCollection::getExamTypeId)
                .orElse(null);
    }

    private String normalize(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String trimOrNull(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
