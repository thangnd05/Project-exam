package com.project_exam.backend.modules.classroom.clazz.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "classes", indexes = {
    @Index(name = "idx_classes_teacher_id", columnList = "teacher_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassEntity {

    @Id
    @UuidV7
    @Column(name = "class_id", nullable = false)
    private String classId;

    @Column(name = "class_name", nullable = false, length = 100)
    private String className;

    @Column(name = "class_qr", nullable = false, unique = true, length = 12)
    private String classQr;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "teacher_id", nullable = false)
    private String teacherId; // FK -> users.user_id

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
