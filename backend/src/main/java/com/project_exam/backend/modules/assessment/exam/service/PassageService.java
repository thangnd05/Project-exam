package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.dto.PassageRequest;
import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.mapper.PassageMapper;
import com.project_exam.backend.modules.assessment.exam.repository.PassageRepository;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PassageService {

    private final PassageRepository passageRepository;
    private final PassageMapper passageMapper;
    private final AuthUtils authUtils;

    private PassageResponse toResponse(Passage passage) {
        return passageMapper.toResponse(passage);
    }

    private Passage toEntity(PassageRequest request) {
        Passage passage = new Passage();
        passage.setContent(request.getContent());
        passage.setContentTranslation(request.getContentTranslation());
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
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MANAGE);
        return toResponse(save(toEntity(request)));
    }

    public Optional<PassageResponse> update(String id, PassageRequest request) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MANAGE);
        return findById(id)
                .map(existing -> {
                    Passage updatedPassage = toEntity(request);
                    updatedPassage.setPassageId(id);
                    return toResponse(save(updatedPassage));
                });
    }

    public void deleteById(String id) {
        authUtils.requirePermission(PermissionCatalog.PASSAGE_MANAGE);
        passageRepository.deleteById(id);
    }
}
