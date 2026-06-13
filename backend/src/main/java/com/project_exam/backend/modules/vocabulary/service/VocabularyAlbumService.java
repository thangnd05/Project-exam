package com.project_exam.backend.modules.vocabulary.service;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.vocabulary.dto.VocabularyAlbumRequest;
import com.project_exam.backend.modules.vocabulary.dto.VocabularyAlbumResponse;
import com.project_exam.backend.modules.vocabulary.domain.VocabularyAlbum;
import com.project_exam.backend.modules.vocabulary.mapper.VocabularyAlbumMapper;
import com.project_exam.backend.modules.vocabulary.repository.VocabularyAlbumRepository;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
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
    public VocabularyAlbumResponse update(String id, VocabularyAlbumRequest request) {

        VocabularyAlbum album = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Album không tồn tại"));

        album.setName(request.getName());
        album.setDescription(request.getDescription());

        album = repository.save(album);

        return toResponse(album);
    }

    // =========================
    // DELETE
    // =========================
    public void delete(String id) {

        VocabularyAlbum album = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Album không tồn tại"));

        repository.delete(album);
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