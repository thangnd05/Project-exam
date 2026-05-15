package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String tagId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "exam_type_id", nullable = false)
    private String examTypeId; // FK -> exam_types

    @Column(name = "parent_id")
    private String parentId; // FK -> tags (nullable, tạo cấu trúc cây)

}
