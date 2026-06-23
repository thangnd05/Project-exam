package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "question_collections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCollection {

    @Id
    @UuidV7
    private String collectionId;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;
}
