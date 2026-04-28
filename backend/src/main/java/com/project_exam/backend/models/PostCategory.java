package com.project_exam.backend.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "post_category",
    uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "category_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "post_id", nullable = false)
    private String postId; // FK -> posts.id

    @Column(name = "category_id", nullable = false)
    private String categoryId; // FK -> categories.id
}
