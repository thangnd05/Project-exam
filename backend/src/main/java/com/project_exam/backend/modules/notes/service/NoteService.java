package com.project_exam.backend.modules.notes.service;

import com.project_exam.backend.modules.notes.domain.Note;
import com.project_exam.backend.modules.notes.dto.NoteRequest;
import com.project_exam.backend.modules.notes.dto.NoteResponse;
import com.project_exam.backend.modules.notes.mapper.NoteMapper;
import com.project_exam.backend.modules.notes.repository.NoteRepository;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository repository;
    private final NoteMapper noteMapper;

    @Transactional(readOnly = true)
    public List<NoteResponse> findAllForCurrentUser(String userId) {
        return repository.findAllByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(noteMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse findById(String noteId, String userId) {
        return noteMapper.toResponse(requireOwnedNote(noteId, userId));
    }

    @Transactional
    public NoteResponse create(NoteRequest request, String userId) {
        Note note = new Note(userId, request.getTitle().trim(), request.getContent());
        return noteMapper.toResponse(repository.save(note));
    }

    @Transactional
    public NoteResponse update(String noteId, NoteRequest request, String userId) {
        Note note = requireOwnedNote(noteId, userId);
        note.setTitle(request.getTitle().trim());
        note.setContent(request.getContent());
        return noteMapper.toResponse(repository.save(note));
    }

    @Transactional
    public void delete(String noteId, String userId) {
        repository.delete(requireOwnedNote(noteId, userId));
    }

    private Note requireOwnedNote(String noteId, String userId) {
        Note note = repository.findById(noteId)
                .orElseThrow(() -> new NotFoundException("Ghi chú không tồn tại"));

        if (!note.getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác ghi chú này.");
        }
        return note;
    }
}
