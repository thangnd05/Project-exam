package com.project_exam.backend.services.LearningVoca;

import com.project_exam.backend.exception.BadRequestException;
import com.project_exam.backend.exception.NotFoundException;

import com.project_exam.backend.dto.request.VocabularyRequest;
import com.project_exam.backend.dto.response.VocabularyResponse;
import com.project_exam.backend.models.DictionaryResult;
import com.project_exam.backend.models.Vocabulary;
import com.project_exam.backend.models.VocabularyAlbum;
import com.project_exam.backend.repositories.VocabularyAlbumRepository;
import com.project_exam.backend.repositories.VocabularyRepository;
import com.project_exam.backend.services.ApiExtend.DictionaryApiService;
import com.project_exam.backend.services.ApiExtend.TextToSpeechService;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class VocabularyService {

    private final VocabularyRepository repository;
    private final VocabularyAlbumRepository albumRepository;
    private final DictionaryApiService dictionaryApiService;
    private final TextToSpeechService textToSpeechService;
    private final AuthUtils authUtils;

    // =========================
    // GET ALL
    // =========================
    public List<VocabularyResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================
    // GET BY ID
    // =========================
    public VocabularyResponse findById(String id) {
        Vocabulary vocab = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vocabulary không tồn tại"));

        return toResponse(vocab);
    }

    // =========================
    // DELETE
    // =========================
    public void delete(String id) {
        Vocabulary vocab = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vocabulary không tồn tại"));

        repository.delete(vocab);
    }

    // =========================
    // CREATE
    // =========================
    public VocabularyResponse createVocabulary(VocabularyRequest request) {

        VocabularyAlbum album;

        if (request.getAlbumId() != null) {
            album = albumRepository.findById(request.getAlbumId())
                    .orElseThrow(() -> new NotFoundException("Album không tồn tại"));
        } else if (request.getNewAlbumName() != null && !request.getNewAlbumName().isEmpty()) {
            album = new VocabularyAlbum();
            album.setName(request.getNewAlbumName());
            album.setDescription(request.getNewAlbumDesc());
            album.setUserId(request.getUserId());
            album = albumRepository.save(album);
        } else {
            throw new BadRequestException("Phải chọn album sẵn có hoặc nhập tên album mới");
        }

        Vocabulary vocab = new Vocabulary();
        vocab.setWord(request.getWord());
        vocab.setMeaning(request.getMeaning());
        vocab.setExample(request.getExample());
        vocab.setAlbumId(album.getAlbumId());

        DictionaryResult result = dictionaryApiService.fetchWordInfo(request.getWord());

        if (result != null) {
            vocab.setPhonetic(result.getPhonetic());

            if (result.getAudioUrl() != null && !result.getAudioUrl().isEmpty()) {
                vocab.setVoiceUrl(result.getAudioUrl());
            } else {
                vocab.setVoiceUrl(textToSpeechService.generateAudio(request.getWord()));
            }
        } else {
            vocab.setVoiceUrl(textToSpeechService.generateAudio(request.getWord()));
        }

        vocab = repository.save(vocab);

        return toResponse(vocab);
    }

    // =========================
    // UPDATE
    // =========================
    public VocabularyResponse updateVocabulary(String vocabId, VocabularyRequest request) {

        Vocabulary vocab = repository.findById(vocabId)
                .orElseThrow(() -> new NotFoundException("Vocabulary không tồn tại"));

        vocab.setWord(request.getWord());
        vocab.setMeaning(request.getMeaning());
        vocab.setExample(request.getExample());

        if (request.getAlbumId() != null) {
            vocab.setAlbumId(request.getAlbumId());
        }

        DictionaryResult result = dictionaryApiService.fetchWordInfo(request.getWord());

        if (result != null) {
            vocab.setPhonetic(result.getPhonetic());

            if (result.getAudioUrl() != null && !result.getAudioUrl().isEmpty()) {
                vocab.setVoiceUrl(result.getAudioUrl());
            } else {
                vocab.setVoiceUrl(textToSpeechService.generateAudio(request.getWord()));
            }

        } else {
            vocab.setVoiceUrl(textToSpeechService.generateAudio(request.getWord()));
        }

        vocab = repository.save(vocab);

        return toResponse(vocab);
    }

    // =========================
    // FIND BY ALBUM
    // =========================
    public List<VocabularyResponse> findAllByAlbumId(String albumId, HttpServletRequest request) {

        String currentUserId = authUtils.getUserId(request);

        VocabularyAlbum album = albumRepository.findById(albumId)
                .orElseThrow(() -> new NotFoundException("Album không tồn tại"));

        if (!album.getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập album này!");
        }

        return repository.findByAlbumId(albumId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================
    // MAPPER ENTITY -> DTO
    // =========================
    private VocabularyResponse toResponse(Vocabulary vocab) {

        VocabularyResponse response = new VocabularyResponse();

        response.setVocabId(vocab.getVocabId());
        response.setWord(vocab.getWord());
        response.setPhonetic(vocab.getPhonetic());
        response.setMeaning(vocab.getMeaning());
        response.setExample(vocab.getExample());
        response.setAlbumId(vocab.getAlbumId());
        response.setVoiceUrl(vocab.getVoiceUrl());
        response.setCreatedAt(vocab.getCreatedAt());

        albumRepository.findById(vocab.getAlbumId()).ifPresent(album -> {
            response.setAlbumName(album.getName());
            response.setAlbumDesc(album.getDescription());
        });

        return response;
    }
}