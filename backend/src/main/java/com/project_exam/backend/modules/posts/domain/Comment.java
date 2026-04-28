package com.project_exam.backend.modules.posts.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "post_id", nullable = false)
    private String postId; // FK -> posts.id

    @Column(name = "user_id", nullable = false)
    private String userId; // FK -> users.user_id

    @Column(name = "parent_id")
    private String parentId; // nullable — nếu null là top-level, nếu có là reply

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
