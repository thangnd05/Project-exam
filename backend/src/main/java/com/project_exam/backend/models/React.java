package com.project_exam.backend.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "reacts",
    uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class React {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "post_id", nullable = false)
    private String postId; // FK -> posts.id

    @Column(name = "user_id", nullable = false)
    private String userId; // FK -> users.user_id

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReactType type;

    public enum ReactType {
        LIKE, LOVE, HAHA, WOW, SAD, ANGRY
    }
}
