package com.project_exam.backend.modules.assessment.learning.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
public class PlanPhaseDto {

    private String phaseId;
    private Integer phaseOrder;

    private String examPartId;
    private String examPartName;

    private Integer daysAllocated;
    private Integer practiceSize;

    /** % đúng tại part này khi chẩn đoán. */
    private BigDecimal currentPercentage;

    /** weakness score đã tính (cao = ưu tiên). */
    private BigDecimal weaknessScore;

    /** Tag yếu nhất, có name để hiển thị. */
    private List<WeakTagDto> weakTags;

    /** Tài liệu phương pháp gợi ý đọc trước khi luyện (lấy từ RecoveryResource theo tag). */
    private List<RecommendedResourceDto> recommendedResources;

    /** Câu hỏi đề xuất luyện trong phase này. */
    private List<String> recommendedQuestionIds;

    private Integer completedPractices;

    @Getter
    @Setter
    @Builder
    public static class WeakTagDto {
        private String tagId;
        private String tagName;
        private double percentage;
    }

    @Getter
    @Setter
    @Builder
    public static class RecommendedResourceDto {
        private String resourceId;
        private String title;
        private String description;
        private String url;
        private String originalFileName;
    }
}
