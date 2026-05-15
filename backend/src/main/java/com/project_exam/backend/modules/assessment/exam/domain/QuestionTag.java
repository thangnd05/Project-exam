package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "question_tags",
       uniqueConstraints = @UniqueConstraint(columnNames = {"question_id", "tag_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "question_id", nullable = false)
    private String questionId; // FK -> questions

    @Column(name = "tag_id", nullable = false)
    private String tagId; // FK -> tags

}
