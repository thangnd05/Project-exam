package com.project_exam.backend.modules.posts.post.mapper;

import com.project_exam.backend.modules.gamification.cosmetic.dto.EquippedCosmeticsResponse;
import com.project_exam.backend.modules.posts.post.domain.Post;
import com.project_exam.backend.modules.posts.category.dto.CategoryResponse;
import com.project_exam.backend.modules.posts.post.dto.PostResponse;
import com.project_exam.backend.modules.posts.post.dto.PostSummaryResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class PostMapper {

    public PostResponse toFullResponse(Post post,
                                       String authorName,
                                       String authorAvatar,
                                       EquippedCosmeticsResponse authorCosmetics,
                                       List<CategoryResponse> categories,
                                       Map<String, Long> reactCounts,
                                       String currentUserReactType,
                                       long commentCount,
                                       long saveCount,
                                       boolean currentUserSaved) {
        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .authorName(authorName)
                .authorAvatar(authorAvatar)
                .equippedFrame(authorCosmetics != null ? authorCosmetics.getFrame() : null)
                .equippedBadge(authorCosmetics != null ? authorCosmetics.getBadge() : null)
                .title(post.getTitle())
                .content(post.getContent())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .thumbnailUrl(post.getThumbnailUrl())
                .categories(categories)
                .reactCounts(reactCounts)
                .currentUserReactType(currentUserReactType)
                .commentCount(commentCount)
                .viewCount(post.getViewCount() == null ? 0L : post.getViewCount())
                .saveCount(saveCount)
                .currentUserSaved(currentUserSaved)
                .build();
    }

    public PostSummaryResponse toSummaryResponse(Post post,
                                                 String authorName,
                                                 String authorAvatar,
                                                 EquippedCosmeticsResponse authorCosmetics,
                                                 String thumbnailUrl,
                                                 List<CategoryResponse> categories,
                                                 long commentCount,
                                                 long totalReacts,
                                                 long saveCount) {
        return PostSummaryResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .authorName(authorName)
                .authorAvatar(authorAvatar)
                .equippedFrame(authorCosmetics != null ? authorCosmetics.getFrame() : null)
                .equippedBadge(authorCosmetics != null ? authorCosmetics.getBadge() : null)
                .title(post.getTitle())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .thumbnailUrl(thumbnailUrl)
                .categories(categories)
                .commentCount(commentCount)
                .totalReacts(totalReacts)
                .viewCount(post.getViewCount() == null ? 0L : post.getViewCount())
                .saveCount(saveCount)
                .build();
    }
}
