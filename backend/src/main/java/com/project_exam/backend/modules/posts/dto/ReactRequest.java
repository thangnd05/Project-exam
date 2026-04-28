package com.project_exam.backend.modules.posts.dto;

import com.project_exam.backend.modules.posts.domain.React;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReactRequest {
    private React.ReactType type; // LIKE, LOVE, HAHA, WOW, SAD, ANGRY
}
