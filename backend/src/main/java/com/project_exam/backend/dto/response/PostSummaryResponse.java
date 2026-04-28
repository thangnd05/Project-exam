package com.project_exam.backend.dto.response;

import com.project_exam.backend.models.Post;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostSummaryResponse {
    private String id;
    private String userId;
    private String title;
    private Post.PostStatus status;
    private LocalDateTime createdAt;
    private String thumbnail; // imageUrl của ảnh đầu tiên (order = 0)
    private List<CategoryResponse> categories;
    private long commentCount;
    private long totalReacts;
}
