package com.project_exam.backend.modules.posts.comment.mapper;

import com.project_exam.backend.modules.gamification.cosmetic.dto.EquippedCosmeticsResponse;
import com.project_exam.backend.modules.posts.comment.domain.Comment;
import com.project_exam.backend.modules.posts.comment.dto.CommentResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CommentMapper {

    /**
     * Map sang CommentResponse. author/cosmetics và replies do service chuẩn bị
     * rồi truyền vào (mapper thuần, không gọi DB).
     */
    public CommentResponse toResponse(Comment c,
                                      List<CommentResponse> replies,
                                      String authorName,
                                      String authorAvatar,
                                      EquippedCosmeticsResponse equipped) {
        return CommentResponse.builder()
                .id(c.getId())
                .postId(c.getPostId())
                .userId(c.getUserId())
                .authorName(authorName)
                .authorAvatar(authorAvatar)
                .equippedFrame(equipped != null ? equipped.getFrame() : null)
                .equippedBadge(equipped != null ? equipped.getBadge() : null)
                .parentId(c.getParentId())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .replies(replies)
                .build();
    }
}
