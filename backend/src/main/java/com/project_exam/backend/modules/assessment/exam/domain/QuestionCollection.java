package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "question_collections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String collectionId;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;
}
