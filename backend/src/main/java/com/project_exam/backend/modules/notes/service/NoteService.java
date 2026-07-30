package com.project_exam.backend.modules.notes.service;

import com.project_exam.backend.modules.notes.domain.Note;
import com.project_exam.backend.modules.notes.dto.NoteRequest;
import com.project_exam.backend.modules.notes.dto.NoteResponse;
import com.project_exam.backend.modules.notes.mapper.NoteMapper;
import com.project_exam.backend.modules.notes.repository.NoteRepository;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Ghi chú là dữ liệu riêng tư: mọi thao tác đều bám theo user đang đăng nhập,
 * không có API nào cho phép đọc ghi chú của người khác kể cả admin.
 */
@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository repository;
    private final NoteMapper noteMapper;
    private final AuthUtils authUtils;

    @Transactional(readOnly = true)
    public List<NoteResponse> findAllForCurrentUser(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return repository.findAllByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(noteMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse findById(String noteId, HttpServletRequest httpRequest) {
        return noteMapper.toResponse(requireOwnedNote(noteId, httpRequest));
    }

    @Transactional
    public NoteResponse create(NoteRequest request, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        Note note = new Note(userId, request.getTitle().trim(), request.getContent());
        return noteMapper.toResponse(repository.save(note));
    }

    @Transactional
    public NoteResponse update(String noteId, NoteRequest request, HttpServletRequest httpRequest) {
        Note note = requireOwnedNote(noteId, httpRequest);
        note.setTitle(request.getTitle().trim());
        note.setContent(request.getContent());
        return noteMapper.toResponse(repository.save(note));
    }

    @Transactional
    public void delete(String noteId, HttpServletRequest httpRequest) {
        repository.delete(requireOwnedNote(noteId, httpRequest));
    }

    private Note requireOwnedNote(String noteId, HttpServletRequest httpRequest) {
        Note note = repository.findById(noteId)
                .orElseThrow(() -> new NotFoundException("Ghi chú không tồn tại"));

        if (!note.getUserId().equals(authUtils.getUserId(httpRequest))) {
            throw new ForbiddenException("Bạn không có quyền thao tác ghi chú này.");
        }
        return note;
    }
}
