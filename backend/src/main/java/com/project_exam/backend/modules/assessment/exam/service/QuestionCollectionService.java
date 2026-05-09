package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionRequest;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionCollectionResponse;
import com.project_exam.backend.modules.assessment.exam.domain.QuestionCollection;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionCollectionRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class QuestionCollectionService {

    private final QuestionCollectionRepository collectionRepository;

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

    public QuestionCollectionResponse create(QuestionCollectionRequest request) {
        QuestionCollection collection = new QuestionCollection();
        collection.setName(request.getName());
        collection.setDescription(request.getDescription());
        collection = collectionRepository.save(collection);
        return toResponse(collection);
    }

    public QuestionCollectionResponse update(String id, QuestionCollectionRequest request) {
        QuestionCollection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Bộ sưu tập câu hỏi không tồn tại"));
        if (request.getName() != null) collection.setName(request.getName());
        if (request.getDescription() != null) collection.setDescription(request.getDescription());
        collection = collectionRepository.save(collection);
        return toResponse(collection);
    }

    public void delete(String id) {
        QuestionCollection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Bộ sưu tập câu hỏi không tồn tại"));
        collectionRepository.delete(collection);
    }

    private QuestionCollectionResponse toResponse(QuestionCollection collection) {
        QuestionCollectionResponse response = new QuestionCollectionResponse();
        response.setCollectionId(collection.getCollectionId());
        response.setName(collection.getName());
        response.setDescription(collection.getDescription());
        return response;
    }
}
