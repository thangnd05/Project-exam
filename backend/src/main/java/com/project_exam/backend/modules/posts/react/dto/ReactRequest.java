package com.project_exam.backend.modules.posts.react.dto;

import com.project_exam.backend.modules.posts.react.domain.React;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReactRequest {
    private React.ReactType type;
}
