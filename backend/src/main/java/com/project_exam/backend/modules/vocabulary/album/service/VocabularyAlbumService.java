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

    public List<VocabularyAlbumResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public VocabularyAlbumResponse findById(String id) {
        VocabularyAlbum album = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Album không tồn tại"));

        return toResponse(album);
    }

    public VocabularyAlbumResponse create(
            VocabularyAlbumRequest request,
            String userId
    ) {
        VocabularyAlbum album = new VocabularyAlbum();
        album.setName(request.getName());
        album.setDescription(request.getDescription());
        album.setUserId(userId);

        album = repository.save(album);

        return toResponse(album);
    }

    public VocabularyAlbumResponse update(String id, VocabularyAlbumRequest request, String userId) {
        VocabularyAlbum album = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Album không tồn tại"));
        requireOwner(album, userId);

        album.setName(request.getName());
        album.setDescription(request.getDescription());

        album = repository.save(album);

        return toResponse(album);
    }

    public void delete(String id, String userId) {
        VocabularyAlbum album = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Album không tồn tại"));
        requireOwner(album, userId);

        repository.delete(album);
    }

    private void requireOwner(VocabularyAlbum album, String userId) {
        if (!userId.equals(album.getUserId()) && !authUtils.hasPermission(PermissionCatalog.VOCABULARY_MANAGE)) {
            throw new ForbiddenException("Bạn không có quyền thao tác album này.");
        }
    }

    public List<VocabularyAlbumResponse> findAllByUserId(String userId) {
        List<VocabularyAlbum> albums = repository.findAllByUserId(userId);
        List<String> albumIds = albums.stream().map(VocabularyAlbum::getAlbumId).toList();

        Map<String, Long> totalMap = new HashMap<>();
        Map<String, Long> masteredMap = new HashMap<>();
        if (!albumIds.isEmpty()) {
            for (Object[] row : vocabularyRepository.countGroupedByAlbumIds(albumIds)) {
                totalMap.put((String) row[0], (Long) row[1]);
            }
            for (Object[] row : userVocabularyRepository.countMasteredGroupedByAlbumIds(userId, albumIds)) {
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

    private VocabularyAlbumResponse toResponse(VocabularyAlbum album) {
        return vocabularyAlbumMapper.toResponse(album);
    }
}
