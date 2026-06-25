package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class SubmitSessionResponse {

    private String sessionId;
    private int correctCount;
    private int totalCount;
    private int accuracy;
    private boolean passed;
    private String taskStatus;
    private String planStage;
    private boolean unlockedNextTask;
    private String message;
    private List<ReviewItem> reviewItems;

    @Getter
    @Setter
    @Builder
    public static class ReviewItem {
        private String questionId;
        private String questionText;
        private String questionType; // MCQ/MSQ/FILL_BLANK/ESSAY → FE biết render thế nào
        private List<ReviewAnswer> answers;
        private String selectedAnswerId;
        private List<String> selectedAnswerIds; // MSQ: các đáp án user đã chọn
        private String correctAnswerId;
        private boolean isCorrect;
        private String explanation;
    }

    @Getter
    @Setter
    @Builder
    public static class ReviewAnswer {
        private String answerId;
        private String answerText;
        private String answerLabel;
        private boolean isCorrect;
    }
}
