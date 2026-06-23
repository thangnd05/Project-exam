package com.project_exam.backend.modules.assessment.exam.domain;

import jakarta.persistence.*;
import com.project_exam.backend.infrastructure.persistence.UuidV7;
import lombok.Data;

@Entity
@Table(name = "passage_media", indexes = {
        @Index(name = "idx_passage_media_passage_id", columnList = "passage_id")
})
@Data
public class PassageMedia {

    @Id
    @UuidV7
    private String id;

    private String passageId;

    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    private MediaType mediaType;

    public enum MediaType {
        IMAGE,
        AUDIO,
        DOCUMENT,
    }
}

