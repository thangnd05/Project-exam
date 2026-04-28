package com.project_exam.backend.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CategoryRequest {
    private String name;
    private String slug; // optional — tự generate từ name nếu để trống
}
