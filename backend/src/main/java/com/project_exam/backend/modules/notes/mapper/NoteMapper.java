package com.project_exam.backend.modules.notes.mapper;

import com.project_exam.backend.modules.notes.domain.Note;
import com.project_exam.backend.modules.notes.dto.NoteResponse;
import org.springframework.stereotype.Component;

@Component
public class NoteMapper {

    public NoteResponse toResponse(Note note) {
        return NoteResponse.builder()
                .noteId(note.getNoteId())
                .title(note.getTitle())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
