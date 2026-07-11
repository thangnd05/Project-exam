package com.project_exam.backend.modules.vocabulary.album.service;

import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.vocabulary.album.dto.VocabularyAlbumRequest;
import com.project_exam.backend.modules.vocabulary.album.dto.VocabularyAlbumResponse;
import com.project_exam.backend.modules.vocabulary.album.domain.VocabularyAlbum;
import com.project_exam.backend.modules.vocabulary.album.mapper.VocabularyAlbumMapper;
import com.project_exam.backend.modules.vocabulary.album.repository.VocabularyAlbumRepository;
import com.project_exam.backend.modules.vocabulary.learning.repository.UserVocabularyRepository;
import com.project_exam.backend.modules.vocabulary.word.repository.VocabularyRepository;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VocabularyAlbumService {

    private final VocabularyAlbumRepository repository;
    private final AuthUtils authUtils;
    private final VocabularyAlbumMapper vocabularyAlbumMapper;
    private final VocabularyRepository vocabularyRepository;
    private final UserVocabularyRepository userVocabularyRepository;

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

        List<VocabularyAlbum> albums = repository.findAllByUserId(currentUserId);
        List<String> albumIds = albums.stream().map(VocabularyAlbum::getAlbumId).toList();

        Map<String, Long> totalMap = new HashMap<>();
        Map<String, Long> masteredMap = new HashMap<>();
        if (!albumIds.isEmpty()) {
            for (Object[] row : vocabularyRepository.countGroupedByAlbumIds(albumIds)) {
                totalMap.put((String) row[0], (Long) row[1]);
            }
            for (Object[] row : userVocabularyRepository.countMasteredGroupedByAlbumIds(currentUserId, albumIds)) {
                masteredMap.put((String) row[0], (Long) row[1]);
            }
        }

        return albums.stream()
                .map(album -> {
                    VocabularyAlbumResponse res = vocabularyAlbumMapper.toResponse(album);
                    res.setTotalWords(totalMap.getOrDefault(album.getAlbumId(), 0L).intValue());
                    res.setMasteredWords(masteredMap.getOrDefault(album.getAlbumId(), 0L).intValue());
                    return res;
                })
                .toList();
    }

    // =========================
    // MAPPER
    // =========================
    private VocabularyAlbumResponse toResponse(VocabularyAlbum album) {
        return vocabularyAlbumMapper.toResponse(album);
    }
}