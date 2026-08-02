package com.project_exam.backend.modules.vocabulary.learning.service;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.vocabulary.learning.dto.UserVocabularyRequest;
import com.project_exam.backend.modules.vocabulary.learning.dto.UserVocabularyResponse;
import com.project_exam.backend.modules.vocabulary.learning.domain.UserVocabulary;
import com.project_exam.backend.modules.vocabulary.learning.mapper.UserVocabularyMapper;
import com.project_exam.backend.modules.vocabulary.learning.repository.UserVocabularyRepository;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserVocabularyService {

    private final UserVocabularyRepository repository;
    private final AuthUtils authUtils;
    private final UserVocabularyMapper userVocabularyMapper;

    public List<UserVocabularyResponse> findAllForCurrentUser(String userId) {
        return repository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public UserVocabularyResponse findById(String id, String userId) {
        UserVocabulary uv = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("User vocabulary không tồn tại"));
        requireOwner(uv, userId);
        return toResponse(uv);
    }

    private void requireOwner(UserVocabulary uv, String userId) {
        if (!uv.getUserId().equals(userId) && !authUtils.hasPermission(PermissionCatalog.VOCABULARY_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền thao tác mục từ vựng này.");
        }
    }

    public UserVocabularyResponse create(UserVocabularyRequest request, String userId) {
        UserVocabulary uv = new UserVocabulary(userId, request.getVocabId());
        if (request.getStatus() != null) uv.setStatus(request.getStatus());
        uv = repository.save(uv);
        return toResponse(uv);
    }

    public UserVocabularyResponse update(String id, UserVocabularyRequest request, String userId) {
        UserVocabulary uv = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("User vocabulary không tồn tại"));
        requireOwner(uv, userId);
        if (request.getVocabId() != null) uv.setVocabId(request.getVocabId());
        if (request.getStatus() != null) uv.setStatus(request.getStatus());
        uv = repository.save(uv);
        return toResponse(uv);
    }

    public void delete(String id, String userId) {
        UserVocabulary uv = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("User vocabulary không tồn tại"));
        requireOwner(uv, userId);
        repository.delete(uv);
    }

    @Transactional
    public void deleteAllForCurrentUser(String userId) {
        repository.deleteByUserId(userId);
    }

    private UserVocabularyResponse toResponse(UserVocabulary uv) {
        return userVocabularyMapper.toResponse(uv);
    }
}
