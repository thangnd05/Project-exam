package com.project_exam.backend.modules.notes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteResponse {

    private String noteId;
    private String title;
    private String content;
    private Instant createdAt;
    private Instant updatedAt;
}
