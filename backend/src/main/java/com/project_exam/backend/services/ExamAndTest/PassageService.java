package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.dto.request.PassageRequest;
import com.project_exam.backend.dto.response.PassageResponse;
import com.project_exam.backend.models.Passage;
import com.project_exam.backend.repositories.PassageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PassageService {

    private final PassageRepository passageRepository;

    public PassageService(PassageRepository passageRepository) {
        this.passageRepository = passageRepository;
    }

    private PassageResponse toResponse(Passage passage) {
        return new PassageResponse(
                passage.getPassageId(),
                passage.getContent(),
                passage.getMediaUrl(),
                passage.getPassageType()
        );
    }

    private Passage toEntity(PassageRequest request) {
        Passage passage = new Passage();
        passage.setContent(request.getContent());
        passage.setMediaUrl(request.getMediaUrl());
        passage.setPassageType(request.getPassageType());
        return passage;
    }

    public List<Passage> findAll() {
        return passageRepository.findAll();
    }

    public List<PassageResponse> findAllResponses() {
        return findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public Optional<Passage> findById(String id) {
        return passageRepository.findById(id);
    }

    public Optional<PassageResponse> findResponseById(String id) {
        return findById(id).map(this::toResponse);
    }

    public Passage save(Passage passage) {
        return passageRepository.save(passage);
    }

    public PassageResponse create(PassageRequest request) {
        return toResponse(save(toEntity(request)));
    }

    public Optional<PassageResponse> update(String id, PassageRequest request) {
        return findById(id)
                .map(existing -> {
                    Passage updatedPassage = toEntity(request);
                    updatedPassage.setPassageId(id);
                    return toResponse(save(updatedPassage));
                });
    }

    public void deleteById(String id) {
        passageRepository.deleteById(id);
    }
}
