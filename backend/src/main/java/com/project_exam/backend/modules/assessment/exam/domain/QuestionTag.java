package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "question_tags",
       uniqueConstraints = @UniqueConstraint(columnNames = {"question_id", "tag_id"}),
       indexes = {
           @Index(name = "idx_question_tags_tag_id", columnList = "tag_id")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionTag {

    @Id
    @UuidV7
    private String id;

    @Column(name = "question_id", nullable = false)
    private String questionId;

    @Column(name = "tag_id", nullable = false)
    private String tagId;

}
