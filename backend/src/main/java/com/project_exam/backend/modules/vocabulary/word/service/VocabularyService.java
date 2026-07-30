package com.project_exam.backend.modules.vocabulary.word.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.vocabulary.word.dto.VocabularyRequest;
import com.project_exam.backend.modules.vocabulary.word.dto.VocabularyResponse;
import com.project_exam.backend.modules.vocabulary.lookup.domain.DictionaryResult;
import com.project_exam.backend.modules.vocabulary.word.domain.Vocabulary;
import com.project_exam.backend.modules.vocabulary.album.domain.VocabularyAlbum;
import com.project_exam.backend.modules.vocabulary.word.mapper.VocabularyMapper;
import com.project_exam.backend.modules.vocabulary.album.repository.VocabularyAlbumRepository;
import com.project_exam.backend.modules.vocabulary.word.repository.VocabularyRepository;
import com.project_exam.backend.modules.vocabulary.lookup.service.DictionaryApiService;
import com.project_exam.backend.modules.vocabulary.lookup.service.TextToSpeechService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VocabularyService {

    private final VocabularyRepository repository;
    private final VocabularyAlbumRepository albumRepository;
    private final DictionaryApiService dictionaryApiService;
    private final TextToSpeechService textToSpeechService;
    private final AuthUtils authUtils;
    private final VocabularyMapper vocabularyMapper;

    public List<VocabularyResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public VocabularyResponse findById(String id) {
        Vocabulary vocab = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vocabulary không tồn tại"));

        return toResponse(vocab);
    }

    public void delete(String id) {
        Vocabulary vocab = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vocabulary không tồn tại"));

        repository.delete(vocab);
    }

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

    public List<VocabularyResponse> createVocabularies(List<VocabularyRequest> requests) {
        return requests.stream().map(this::createVocabulary).toList();
    }

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

    private VocabularyResponse toResponse(Vocabulary vocab) {

        VocabularyResponse response = vocabularyMapper.toResponse(vocab);

        albumRepository.findById(vocab.getAlbumId()).ifPresent(album -> {
            response.setAlbumName(album.getName());
            response.setAlbumDesc(album.getDescription());
        });

        return response;
    }
}
