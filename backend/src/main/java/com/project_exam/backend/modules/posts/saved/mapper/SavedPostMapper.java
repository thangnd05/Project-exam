package com.project_exam.backend.modules.posts.saved.mapper;

import com.project_exam.backend.modules.posts.saved.dto.SavedPostStatusResponse;
import org.springframework.stereotype.Component;

@Component
public class SavedPostMapper {

    public SavedPostStatusResponse toStatusResponse(boolean saved, long saveCount) {
        return SavedPostStatusResponse.builder()
                .saved(saved)
                .saveCount(saveCount)
                .build();
    }
}
