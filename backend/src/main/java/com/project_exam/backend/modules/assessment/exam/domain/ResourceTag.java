package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resource_tags",
       uniqueConstraints = @UniqueConstraint(columnNames = {"resource_id", "tag_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResourceTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "resource_id", nullable = false)
    private String resourceId;

    @Column(name = "tag_id", nullable = false)
    private String tagId;

}
