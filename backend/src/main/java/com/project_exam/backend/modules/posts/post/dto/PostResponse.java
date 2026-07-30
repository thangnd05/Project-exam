package com.project_exam.backend.modules.posts.post.dto;
import com.project_exam.backend.modules.posts.category.dto.CategoryResponse;

import com.project_exam.backend.modules.posts.post.domain.Post;
import com.project_exam.backend.modules.gamification.cosmetic.dto.CosmeticResponse;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class PostResponse {
    private String id;
    private String userId;
    private String authorName;
    private String authorAvatar;
    private CosmeticResponse equippedFrame;
    private CosmeticResponse equippedBadge;
    private String title;
    private String content;
    private Post.PostStatus status;
    private Instant createdAt;
    private String thumbnailUrl;

    private List<CategoryResponse> categories;

    private Map<String, Long> reactCounts;
    private String currentUserReactType;
    private long commentCount;
    private long viewCount;
    private long saveCount;
    private boolean currentUserSaved;
}
