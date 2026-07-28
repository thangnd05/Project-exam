package com.project_exam.backend.modules.assessment.learning.dto;

import com.project_exam.backend.modules.assessment.test.dto.QuestionResponse;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class CurrentSessionResponse {

    /** PICK = chọn ải; QUIZ = đang làm bài; MOCK = đã xong ải. */
    private String mode;

    private String learningPlanId;
    /** Kỳ thi của plan — FE cần để trỏ sang danh sách đề khi đã hết ải (stage MOCK). */
    private String examTypeId;
    private String planStage;
    private String sessionId;
    private String sessionStatus;
    private PlanTaskDto activeTask;
    private PlanPhaseDto.RecommendedResourceDto resource;
    private Integer questionCount;
    private Integer passAccuracyRequired;
    // Kết quả của phiên đã nộp gần nhất (mode REVIEW) — để trang kết quả sống sót khi F5.
    private Integer correctCount;
    private Integer totalCount;
    private Integer accuracy;
    private Boolean passed;
    private List<QuestionResponse> questions;
    private Integer totalTasks;
    private Integer passedTasks;
    private String message;
    private List<PlanPartGroupDto> partGroups;
    private List<PlanTaskDto> tasks;
    private List<SubmitSessionResponse.ReviewItem> lastReviewItems;
}
