package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import com.project_exam.backend.modules.assessment.exam.domain.QuestionCollection;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionCollectionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class QuestionCollectionService {

    private final QuestionCollectionRepository collectionRepository;
    private final QuestionRepository questionRepository;

    public List<QuestionCollectionResponse> findAll() {
        return collectionRepository.findAll().stream()
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
        // 🔒 Chống trùng tên (case-insensitive). DB cũng có unique constraint, nhưng kiểm tra
        // trước để trả về thông báo rõ ràng thay vì SQLException.
        collectionRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            throw new ConflictException("Tên bộ sưu tập đã tồn tại.");
        });
        QuestionCollection collection = new QuestionCollection();
        collection.setName(name);
        collection.setDescription(trimOrNull(request.getDescription()));
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
            // Chỉ check trùng nếu đổi sang tên khác.
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

        collection = collectionRepository.save(collection);
        return toResponse(collection);
    }

    @Transactional
    public void delete(String id) {
        QuestionCollection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Bộ sưu tập câu hỏi không tồn tại"));
        // 🔒 Chặn xoá khi đang có câu hỏi gắn vào — tránh orphan reference.
        long inUse = questionRepository.countByCollectionId(id);
        if (inUse > 0) {
            throw new ConflictException(
                    "Không thể xoá: bộ sưu tập đang có " + inUse + " câu hỏi. " +
                            "Hãy bỏ liên kết các câu hỏi trước khi xoá."
            );
        }
        collectionRepository.delete(collection);
    }

    private QuestionCollectionResponse toResponse(QuestionCollection collection) {
        QuestionCollectionResponse response = new QuestionCollectionResponse();
        response.setCollectionId(collection.getCollectionId());
        response.setName(collection.getName());
        response.setDescription(collection.getDescription());
        response.setQuestionCount(questionRepository.countByCollectionId(collection.getCollectionId()));
        return response;
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
