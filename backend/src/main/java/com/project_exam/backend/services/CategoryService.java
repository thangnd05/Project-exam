package com.project_exam.backend.services;

import com.project_exam.backend.dto.request.CategoryRequest;
import com.project_exam.backend.dto.response.CategoryResponse;
import com.project_exam.backend.exception.NotFoundException;
import com.project_exam.backend.models.Category;
import com.project_exam.backend.repositories.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .build();
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
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Slug đã tồn tại: " + slug);
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
        // Cho phép giữ nguyên slug nếu không đổi
        if (!slug.equals(c.getSlug()) && categoryRepository.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Slug đã tồn tại: " + slug);
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

    // ─────────────────────────────────────────────
    // HELPER: tạo slug từ name nếu slug trống
    // ─────────────────────────────────────────────
    private String resolveSlug(String slug, String name) {
        if (slug != null && !slug.isBlank()) return slug.trim().toLowerCase();
        return generateSlug(name);
    }

    public static String generateSlug(String name) {
        if (name == null) return "";
        // Normalize Unicode (NFD) rồi bỏ dấu
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }
}
