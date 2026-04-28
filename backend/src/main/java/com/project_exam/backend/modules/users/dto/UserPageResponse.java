package com.project_exam.backend.modules.users.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserPageResponse {
    private List<UserResponse> content;
    private int currentPage;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
}
