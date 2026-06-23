package com.project_exam.backend.modules.posts.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(
    name = "post_category",
    uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "category_id"}),
    indexes = {
        @Index(name = "idx_post_category_category_id", columnList = "category_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostCategory {

    @Id
    @UuidV7
    private String id;

    @Column(name = "post_id", nullable = false)
    private String postId; // FK -> posts.id

    @Column(name = "category_id", nullable = false)
    private String categoryId; // FK -> categories.id
}
