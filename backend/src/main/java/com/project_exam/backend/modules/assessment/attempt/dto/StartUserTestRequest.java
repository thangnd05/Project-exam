package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StartUserTestRequest {
    private String testId;

    // "FULL_TEST" (mặc định) hoặc "PRACTICE". Null -> FULL_TEST.
    private String mode;

    // Danh sách examPartId muốn luyện — chỉ dùng khi mode = PRACTICE.
    private List<String> examPartIds;
}
