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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserVocabularyService {

    private final UserVocabularyRepository repository;
    private final AuthUtils authUtils;
    private final UserVocabularyMapper userVocabularyMapper;

    // Chỉ trả về user-vocabulary của chính người đang đăng nhập (tránh lộ dữ liệu user khác).
    public List<UserVocabularyResponse> findAllForCurrentUser(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return repository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public UserVocabularyResponse findById(String id, HttpServletRequest httpRequest) {
        UserVocabulary uv = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("User vocabulary không tồn tại"));
        requireOwner(uv, httpRequest);
        return toResponse(uv);
    }

    // Chỉ chủ sở hữu (hoặc người có VOCABULARY:MANAGE) mới được thao tác.
    private void requireOwner(UserVocabulary uv, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        if (!uv.getUserId().equals(userId) && !authUtils.hasPermission(PermissionCatalog.VOCABULARY_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền thao tác mục từ vựng này.");
        }
    }

    public UserVocabularyResponse create(UserVocabularyRequest request, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        UserVocabulary uv = new UserVocabulary(userId, request.getVocabId());
        if (request.getStatus() != null) uv.setStatus(request.getStatus());
        uv = repository.save(uv);
        return toResponse(uv);
    }

    public UserVocabularyResponse update(String id, UserVocabularyRequest request, HttpServletRequest httpRequest) {
        UserVocabulary uv = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("User vocabulary không tồn tại"));
        requireOwner(uv, httpRequest);
        if (request.getVocabId() != null) uv.setVocabId(request.getVocabId());
        if (request.getStatus() != null) uv.setStatus(request.getStatus());
        uv = repository.save(uv);
        return toResponse(uv);
    }

    public void delete(String id, HttpServletRequest httpRequest) {
        UserVocabulary uv = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("User vocabulary không tồn tại"));
        requireOwner(uv, httpRequest);
        repository.delete(uv);
    }

    // Chỉ xóa từ vựng của chính user hiện tại (trước đây xóa sạch cả bảng cho mọi user!).
    @Transactional
    public void deleteAllForCurrentUser(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        repository.deleteByUserId(userId);
    }

    private UserVocabularyResponse toResponse(UserVocabulary uv) {
        return userVocabularyMapper.toResponse(uv);
    }
}
