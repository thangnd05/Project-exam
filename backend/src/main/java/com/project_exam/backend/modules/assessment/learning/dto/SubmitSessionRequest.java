package com.project_exam.backend.modules.assessment.learning.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SubmitSessionRequest {

    @NotEmpty(message = "answers không được rỗng")
    private List<AnswerItem> answers;

    @Getter
    @Setter
    public static class AnswerItem {
        @NotBlank
        private String questionId;

        private String selectedAnswerId;

        private List<String> selectedAnswerIds;
    }
}
