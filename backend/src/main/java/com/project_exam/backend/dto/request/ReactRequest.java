package com.project_exam.backend.dto.request;

import com.project_exam.backend.models.React;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReactRequest {
    private React.ReactType type; // LIKE, LOVE, HAHA, WOW, SAD, ANGRY
}
