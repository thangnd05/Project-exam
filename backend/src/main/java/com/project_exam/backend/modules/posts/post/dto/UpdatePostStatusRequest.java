package com.project_exam.backend.modules.posts.post.dto;

import com.project_exam.backend.modules.posts.post.domain.Post;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePostStatusRequest {
    private Post.PostStatus status;
}
