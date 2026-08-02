package com.project_exam.backend.modules.posts.category.service;

import com.project_exam.backend.modules.posts.category.dto.CategoryRequest;
import com.project_exam.backend.modules.posts.category.dto.CategoryResponse;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.modules.posts.category.domain.Category;
import com.project_exam.backend.modules.posts.category.mapper.CategoryMapper;
import com.project_exam.backend.modules.posts.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    private CategoryResponse toResponse(Category c) {
        return categoryMapper.toResponse(c);
    }

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CategoryResponse findById(String id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category không tồn tại"));
        return toResponse(c);
    }

    public CategoryResponse create(CategoryRequest request) {
        String slug = resolveSlug(request.getSlug(), request.getName());
        if (categoryRepository.existsBySlug(slug)) {
            throw new ConflictException("Slug đã tồn tại: " + slug);
        }
        Category c = Category.builder()
                .name(request.getName())
                .slug(slug)
                .build();
        return toResponse(categoryRepository.save(c));
    }

    public CategoryResponse update(String id, CategoryRequest request) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category không tồn tại"));

        String slug = resolveSlug(request.getSlug(), request.getName());

        if (!slug.equals(c.getSlug()) && categoryRepository.existsBySlug(slug)) {
            throw new ConflictException("Slug đã tồn tại: " + slug);
        }
        c.setName(request.getName());
        c.setSlug(slug);
        return toResponse(categoryRepository.save(c));
    }

    public void delete(String id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("Category không tồn tại");
        }
        categoryRepository.deleteById(id);
    }

    private String resolveSlug(String slug, String name) {
        if (slug != null && !slug.isBlank()) return slug.trim().toLowerCase();
        return generateSlug(name);
    }

    public static String generateSlug(String name) {
        if (name == null) return "";

        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }
}
