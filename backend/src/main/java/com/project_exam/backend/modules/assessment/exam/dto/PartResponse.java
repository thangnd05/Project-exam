package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartResponse {
    private String examPartId;     // ID của phần thi (Reading, Listening...)
    private Integer numQuestions; // Số lượng câu hỏi trong phần
    private List<String> questionIds; // Danh sách ID các câu hỏi thuộc phần
}
