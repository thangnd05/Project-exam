package com.project_exam.backend.modules.posts.dto;

import com.project_exam.backend.modules.posts.domain.Post;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class PostResponse {
    private String id;
    private String userId;
    private String authorName;
    private String authorAvatar;
    private String title;
    private String content;
    private Post.PostStatus status;
    private LocalDateTime createdAt;
    private String thumbnailUrl;

    private List<PostImageResponse> images;
    private List<CategoryResponse> categories;

    private Map<String, Long> reactCounts; // {"LIKE": 5, "LOVE": 3, ...}
    private String currentUserReactType;   // react type của current user (null nếu chưa react)
    private long commentCount;
    private long viewCount;

    @Data
    @Builder
    public static class PostImageResponse {
        private String id;
        private String imageUrl;
        private Integer order;
    }
}
