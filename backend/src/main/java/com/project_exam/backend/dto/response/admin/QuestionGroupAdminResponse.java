package com.project_exam.backend.dto.response.admin;

import com.project_exam.backend.dto.response.PassageResponse;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionGroupAdminResponse {

    private PassageResponse passage; // có thể null

    private List<QuestionAdminResponse> questions;
}
