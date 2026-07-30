package com.project_exam.backend.modules.analytics.domain;

import com.project_exam.backend.infrastructure.persistence.UuidV7;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "page_visits",
        indexes = {
                @Index(name = "idx_page_visits_created_at", columnList = "created_at"),
                @Index(name = "idx_page_visits_session_key", columnList = "session_key")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageVisit {

    @Id
    @UuidV7
    private String visitId;

    @Column(nullable = false, length = 255)
    private String path;

    @Column(name = "session_key", length = 64)
    private String sessionKey;

    @Column(name = "user_id", length = 255)
    private String userId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
