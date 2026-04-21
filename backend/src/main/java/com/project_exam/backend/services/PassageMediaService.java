package com.project_exam.backend.services;

import com.project_exam.backend.dto.request.PassageMediaRequest;
import com.project_exam.backend.dto.response.PassageMediaResponse;
import com.project_exam.backend.models.PassageMedia;
import com.project_exam.backend.repositories.PassageMediaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

import java.util.stream.Collectors;

@Service
public class PassageMediaService {

    private final PassageMediaRepository repository;

    public PassageMediaService(PassageMediaRepository repository) {
        this.repository = repository;
    }

    // 🔹 CREATE
    public PassageMediaResponse create(PassageMediaRequest request) {

        PassageMedia media = new PassageMedia();
        media.setPassageId(request.getPassageId());
        media.setMediaUrl(request.getMediaUrl());
        media.setMediaType(PassageMedia.MediaType.valueOf(request.getMediaType()));

        media = repository.save(media);

        return toResponse(media);
    }

    // 🔹 GET BY ID
    public PassageMediaResponse getById(String id) {

        PassageMedia media = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Media không tồn tại"));

        return toResponse(media);
    }

    // 🔹 GET BY PASSAGE
    public List<PassageMediaResponse> getByPassageId(String passageId) {

        return repository.findByPassageId(passageId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // 🔹 UPDATE
    public PassageMediaResponse update(String id, PassageMediaRequest request) {

        PassageMedia media = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Media không tồn tại"));

        media.setMediaUrl(request.getMediaUrl());
        media.setMediaType(PassageMedia.MediaType.valueOf(request.getMediaType()));

        return toResponse(repository.save(media));
    }

    // 🔹 DELETE
    public void delete(String id) {
        repository.deleteById(id);
    }

    // 🔹 MAPPER
    private PassageMediaResponse toResponse(PassageMedia media) {
        return new PassageMediaResponse(
                media.getId(),
                media.getPassageId(),
                media.getMediaUrl(),
                media.getMediaType().name()
        );
    }
}
