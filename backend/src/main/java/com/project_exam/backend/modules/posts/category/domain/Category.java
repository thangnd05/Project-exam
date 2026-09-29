package com.project_exam.backend.modules.posts.category.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.Instant;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "categories", schema = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE posts.categories SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Category {

    @Id
    @UuidV7
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
