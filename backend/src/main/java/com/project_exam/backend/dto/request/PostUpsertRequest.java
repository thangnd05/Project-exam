package com.project_exam.backend.dto.request;

import com.project_exam.backend.models.Post;
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
    private Post.PostStatus status;
    private List<String> categoryIds; // IDs các categories
}
