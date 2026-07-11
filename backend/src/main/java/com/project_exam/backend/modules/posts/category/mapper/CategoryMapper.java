package com.project_exam.backend.modules.posts.category.mapper;

import com.project_exam.backend.modules.posts.category.domain.Category;
import com.project_exam.backend.modules.posts.category.dto.CategoryResponse;
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
