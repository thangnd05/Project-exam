package com.project_exam.backend.modules.posts.post.dto;

import com.project_exam.backend.modules.posts.post.domain.Post;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PostUpsertRequest {
    private String title;
    private String content;
    private String thumbnailUrl;
    private Post.PostStatus status;
    private List<String> categoryIds; // IDs các categories
}
