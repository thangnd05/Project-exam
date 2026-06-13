package com.project_exam.backend.modules.posts.mapper;

import com.project_exam.backend.modules.posts.domain.Category;
import com.project_exam.backend.modules.posts.dto.CategoryResponse;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .build();
    }
}
