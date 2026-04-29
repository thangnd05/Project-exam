package com.project_exam.backend.modules.posts.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CommentResponse {
    private String id;
    private String postId;
    private String userId;
    private String parentId;
    private String content;
    private LocalDateTime createdAt;

    private String authorName;
    private String authorAvatar;

    // Nested replies (chỉ 1 cấp — replies của top-level comment)
    private List<CommentResponse> replies;
}
