package com.project_exam.backend.dto.response;

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

    // Nested replies (chỉ 1 cấp — replies của top-level comment)
    private List<CommentResponse> replies;
}
