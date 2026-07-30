package com.project_exam.backend.shared.dto;

import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

@Data
public class PageResponse<T> {
    private List<T> content;
    private int currentPage;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;

    public static <T> PageResponse<T> from(Page<T> page) {
        return from(page, page.getContent());
    }

    public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
        return from(page, page.getContent().stream().map(mapper).toList());
    }

    public static <E, T> PageResponse<T> from(Page<E> page, List<T> content) {
        PageResponse<T> response = new PageResponse<>();
        response.setContent(content);
        response.setCurrentPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setHasNext(page.hasNext());
        return response;
    }

    public static <T> PageResponse<T> empty(int page, int size) {
        PageResponse<T> response = new PageResponse<>();
        response.setContent(List.of());
        response.setCurrentPage(page);
        response.setSize(size);
        response.setTotalElements(0);
        response.setTotalPages(0);
        response.setHasNext(false);
        return response;
    }
}
