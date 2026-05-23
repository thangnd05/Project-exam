package com.project_exam.backend.modules.assessment.learning.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "learning_plan_phases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlanPhase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String phaseId;

    @Column(name = "learning_plan_id", nullable = false)
    private String learningPlanId;

    @Column(name = "exam_part_id", nullable = false)
    private String examPartId;

    /** Thứ tự ưu tiên (1 = part yếu nhất, học trước). */
    @Column(name = "phase_order", nullable = false)
    private Integer phaseOrder;

    @Column(name = "days_allocated", nullable = false)
    private Integer daysAllocated;

    /** Số câu cần luyện trong phase này. */
    @Column(name = "practice_size", nullable = false)
    private Integer practiceSize;

    /** Điểm weakness đã tính: (100 - accuracy%) × weight. */
    @Column(name = "weakness_score", precision = 6, scale = 2)
    private BigDecimal weaknessScore;

    /** Phần trăm đúng ở part này tại thời điểm chẩn đoán. */
    @Column(name = "current_percentage", precision = 5, scale = 2)
    private BigDecimal currentPercentage;

    /** Danh sách tag ID yếu nhất, CSV. */
    @Column(name = "weak_tag_ids", columnDefinition = "TEXT")
    private String weakTagIds;

    /** Số bài practice đã hoàn thành trong phase này (track progress). */
    @Column(name = "completed_practices", nullable = false)
    private Integer completedPractices = 0;
}
