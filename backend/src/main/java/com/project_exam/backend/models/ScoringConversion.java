package com.project_exam.backend.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scoring_conversion",
        uniqueConstraints = @UniqueConstraint(name = "uk_scoring", columnNames = {"exam_type_id", "skill_id", "num_correct"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ScoringConversion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String conversionId;

    @Column(nullable = false)
    private String examTypeId; // FK -> exam_types

    @Column(nullable = false)
    private String skillId; // FK -> skills

    @Column(nullable = false)
    private Integer numCorrect;

    @Column(nullable = false)
    private Integer convertedScore;
}
