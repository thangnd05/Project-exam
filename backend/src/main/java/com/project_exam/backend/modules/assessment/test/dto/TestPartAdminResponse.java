package com.project_exam.backend.modules.assessment.test.dto;

import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionGroupAdminResponse;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestPartAdminResponse {

    private String testPartId;

    private String examPartId;

    private String partName; // Tên part lấy từ ExamPart.name

    private List<QuestionGroupAdminResponse> questionGroups;
}
