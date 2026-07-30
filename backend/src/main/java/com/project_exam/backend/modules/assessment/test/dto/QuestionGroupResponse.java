package com.project_exam.backend.modules.assessment.test.dto;

import com.project_exam.backend.modules.assessment.exam.dto.PassageResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionGroupResponse {
    private PassageResponse passage;
    private List<QuestionResponse> questions;
}
