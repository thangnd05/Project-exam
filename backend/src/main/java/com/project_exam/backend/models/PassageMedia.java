package com.project_exam.backend.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "passage_media")
@Data
public class PassageMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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

