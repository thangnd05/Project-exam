package com.project_exam.backend.modules.vocabulary.album.service;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.vocabulary.album.dto.VocabularyAlbumRequest;
import com.project_exam.backend.modules.vocabulary.album.dto.VocabularyAlbumResponse;
import com.project_exam.backend.modules.vocabulary.album.domain.VocabularyAlbum;
import com.project_exam.backend.modules.vocabulary.album.mapper.VocabularyAlbumMapper;
import com.project_exam.backend.modules.vocabulary.album.repository.VocabularyAlbumRepository;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VocabularyAlbumService {

    private final VocabularyAlbumRepository repository;
    private final AuthUtils authUtils;
    private final VocabularyAlbumMapper vocabularyAlbumMapper;

    // =========================
    // GET ALL
    // =========================
    public List<VocabularyAlbumResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================
    // GET BY ID
    // =========================
    public VocabularyAlbumResponse findById(String id) {
        VocabularyAlbum album = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Album không tồn tại"));

        return toResponse(album);
    }

    // =========================
    // CREATE
    // =========================
    public VocabularyAlbumResponse create(
            VocabularyAlbumRequest request,
            HttpServletRequest httpRequest
    ) {

        String userId = authUtils.getUserId(httpRequest);

        VocabularyAlbum album = new VocabularyAlbum();
        album.setName(request.getName());
        album.setDescription(request.getDescription());
        album.setUserId(userId);

        album = repository.save(album);

        return toResponse(album);
    }

    // =========================
    // UPDATE
    // =========================
    public VocabularyAlbumResponse update(String id, VocabularyAlbumRequest request, HttpServletRequest httpRequest) {

        VocabularyAlbum album = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Album không tồn tại"));
        requireOwner(album, httpRequest);

        album.setName(request.getName());
        album.setDescription(request.getDescription());

        album = repository.save(album);

        return toResponse(album);
    }

    // =========================
    // DELETE
    // =========================
    public void delete(String id, HttpServletRequest httpRequest) {

        VocabularyAlbum album = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Album không tồn tại"));
        requireOwner(album, httpRequest);

        repository.delete(album);
    }

    // Chỉ chủ album (hoặc người có VOCABULARY:MANAGE) mới được sửa/xóa.
    private void requireOwner(VocabularyAlbum album, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        if (!userId.equals(album.getUserId()) && !authUtils.hasPermission(PermissionCatalog.VOCABULARY_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền thao tác album này.");
        }
    }

    // =========================
    // GET MY ALBUMS
    // =========================
    public List<VocabularyAlbumResponse> findAllByUserId(HttpServletRequest request) {

        String currentUserId = authUtils.getUserId(request);

        return repository.findAllByUserId(currentUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================
    // MAPPER
    // =========================
    private VocabularyAlbumResponse toResponse(VocabularyAlbum album) {
        return vocabularyAlbumMapper.toResponse(album);
    }
}