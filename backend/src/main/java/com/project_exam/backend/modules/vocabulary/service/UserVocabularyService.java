package com.project_exam.backend.modules.vocabulary.service;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.vocabulary.dto.UserVocabularyRequest;
import com.project_exam.backend.modules.vocabulary.dto.UserVocabularyResponse;
import com.project_exam.backend.modules.vocabulary.domain.UserVocabulary;
import com.project_exam.backend.modules.vocabulary.mapper.UserVocabularyMapper;
import com.project_exam.backend.modules.vocabulary.repository.UserVocabularyRepository;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class UserVocabularyService {

    private final UserVocabularyRepository repository;
    private final AuthUtils authUtils;
    private final UserVocabularyMapper userVocabularyMapper;

    public List<UserVocabularyResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserVocabularyResponse findById(String id) {
        UserVocabulary uv = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("User vocabulary không tồn tại"));
        return toResponse(uv);
    }

    public UserVocabularyResponse create(UserVocabularyRequest request, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        UserVocabulary uv = new UserVocabulary(userId, request.getVocabId());
        if (request.getStatus() != null) uv.setStatus(request.getStatus());
        uv = repository.save(uv);
        return toResponse(uv);
    }

    public UserVocabularyResponse update(String id, UserVocabularyRequest request) {
        UserVocabulary uv = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("User vocabulary không tồn tại"));
        if (request.getVocabId() != null) uv.setVocabId(request.getVocabId());
        if (request.getStatus() != null) uv.setStatus(request.getStatus());
        uv = repository.save(uv);
        return toResponse(uv);
    }

    public void delete(String id) {
        UserVocabulary uv = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("User vocabulary không tồn tại"));
        repository.delete(uv);
    }

    public void deleteAllUserVocabulary() {
        repository.deleteAll();
    }

    private UserVocabularyResponse toResponse(UserVocabulary uv) {
        return userVocabularyMapper.toResponse(uv);
    }
}
