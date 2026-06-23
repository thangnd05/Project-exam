package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "resource_tags",
       uniqueConstraints = @UniqueConstraint(columnNames = {"resource_id", "tag_id"}),
       indexes = {
           @Index(name = "idx_resource_tags_tag_id", columnList = "tag_id")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResourceTag {

    @Id
    @UuidV7
    private String id;

    @Column(name = "resource_id", nullable = false)
    private String resourceId;

    @Column(name = "tag_id", nullable = false)
    private String tagId;

}
