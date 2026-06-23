package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "passages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Passage {

    @Id
    @UuidV7
    private String passageId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Bản dịch của content (vd: phần "Dịch:" của transcript Part 3). Có thể null.
    @Column(columnDefinition = "TEXT")
    private String contentTranslation;

    @Column(length = 255)
    private String mediaUrl; // có thể null

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PassageType passageType; // thêm trường này

    public enum PassageType {
        READING,
        LISTENING
    }
}

