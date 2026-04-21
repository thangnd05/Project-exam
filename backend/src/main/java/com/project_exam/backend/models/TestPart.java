package com.project_exam.backend.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "test_parts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestPart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String testPartId;

    @Column(nullable = false)
    private String testId;

    @Column(nullable = false)
    private String examPartId;

    @Column(nullable = false)
    private Integer numQuestions;

}
