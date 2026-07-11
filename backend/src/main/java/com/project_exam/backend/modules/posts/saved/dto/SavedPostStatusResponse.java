package com.project_exam.backend.modules.posts.saved.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class SavedPostStatusResponse {
    private boolean saved;
    private long saveCount;
}
