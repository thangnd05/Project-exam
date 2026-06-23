package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Skill {
    @Id
    @UuidV7
    private String skillId;

    @Column(nullable = false, unique = true, length = 100)
    private String name; // Listening, Reading, Speaking, Writing

    @Column(columnDefinition = "TEXT")
    private String description;
}
