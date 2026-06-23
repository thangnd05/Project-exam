package com.project_exam.backend.modules.assessment.test.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "test_parts",
        indexes = {
                @Index(name = "idx_test_parts_test_id", columnList = "test_id"),
                @Index(name = "idx_test_parts_exam_part_id", columnList = "exam_part_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestPart {

    @Id
    @UuidV7
    private String testPartId;

    @Column(nullable = false)
    private String testId;

    @Column(nullable = false)
    private String examPartId;

    @Column(nullable = false)
    private Integer numQuestions;

}
