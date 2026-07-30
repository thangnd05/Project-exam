package com.project_exam.backend.modules.classroom.member.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "class_members", indexes = {
    @Index(name = "idx_class_members_class_id", columnList = "class_id"),
    @Index(name = "idx_class_members_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassMember {

    @Id
    @UuidV7
    private String id;

    @Column(name = "class_id", nullable = false)
    private String classId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, nullable = false)
    private MemberStatus status = MemberStatus.PENDING;

    @Column(name = "joined_at")
    private Instant joinedAt = Instant.now();

    public enum MemberStatus {
        PENDING,
        APPROVED
    }
}
