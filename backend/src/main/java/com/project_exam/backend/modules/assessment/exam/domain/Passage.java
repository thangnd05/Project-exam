package com.project_exam.backend.modules.assessment.exam.domain;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.Instant;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.*;

@Entity
@Table(name = "passages", schema = "assessment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE assessment.passages SET deleted_at = now() WHERE passage_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Passage {

    @Id
    @UuidV7
    private String passageId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String contentTranslation;

    @Column(length = 255)
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PassageType passageType;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public enum PassageType {
        READING,
        LISTENING
    }
}

