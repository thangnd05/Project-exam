package com.project_exam.backend.modules.posts.dto;

import com.project_exam.backend.modules.posts.domain.Post;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostSummaryResponse {
    private String id;
    private String userId;
    private String authorName;
    private String authorAvatar;
    private String title;
    private Post.PostStatus status;
    private LocalDateTime createdAt;
    private String thumbnailUrl; // URL từ entity hoặc ảnh đầu tiên
    private List<CategoryResponse> categories;
    private long commentCount;
    private long totalReacts;
    private long viewCount;
}
