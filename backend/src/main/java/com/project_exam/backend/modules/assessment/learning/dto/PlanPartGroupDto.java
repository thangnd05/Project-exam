package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class PlanPartGroupDto {

    private String examPartId;
    private String examPartName;
    private Integer displayOrder; // thứ tự part (ExamPart.displayOrder) để FE sắp đúng
    private Integer passAccuracy;
    private int passedTasksInPart;
    private int totalTasksInPart;
    /** Tài liệu giới thiệu/cách làm gắn trực tiếp Part này (đọc trước khi vào các ải). */
    private List<PlanPhaseDto.RecommendedResourceDto> partResources;
    private List<PlanTaskDto> tasks;
}
