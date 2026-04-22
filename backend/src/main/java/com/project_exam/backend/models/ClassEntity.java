package com.project_exam.backend.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassEntity {

    @Id
    @Column(name = "class_id", nullable = false)
    private String classId; // bạn sẽ tự sinh random ID trong service

    @Column(name = "class_name", nullable = false, length = 100)
    private String className;

    @Column(name = "class_qr", nullable = false, unique = true, length = 12)
    private String classQr;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "teacher_id", nullable = false)
    private String teacherId; // FK -> users.user_id

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
