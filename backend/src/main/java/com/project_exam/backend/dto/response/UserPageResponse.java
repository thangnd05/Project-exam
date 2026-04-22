package com.project_exam.backend.dto.response;

import com.project_exam.backend.models.User;
import lombok.Data;

import java.util.List;

@Data
public class UserPageResponse {
    private List<User> content;
    private int currentPage;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
}
