package com.project_exam.backend.modules.posts.comment.dto;

import com.project_exam.backend.modules.gamification.cosmetic.dto.CosmeticResponse;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class CommentResponse {
    private String id;
    private String postId;
    private String userId;
    private String parentId;
    private String content;
    private Instant createdAt;

    private String authorName;
    private String authorAvatar;

    private CosmeticResponse equippedFrame;
    private CosmeticResponse equippedBadge;

    private List<CommentResponse> replies;
}
