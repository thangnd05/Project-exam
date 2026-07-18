package com.project_exam.backend.modules.analytics.domain;

import com.project_exam.backend.infrastructure.persistence.UuidV7;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Một lượt xem trang (page view) do FE ping mỗi lần vào/chuyển route — nguồn dữ liệu "lượt truy cập".
 *
 * <p>sessionKey = định danh trình duyệt ổn định (tái dùng guestSessionId ở localStorage) để đếm
 * khách duy nhất / đang online. userId chỉ có khi người dùng đã đăng nhập (đọc từ JWT), null = khách.
 */
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
    private String userId; // null = khách chưa đăng nhập

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    // Geo-IP: mã ISO alpha-2 + tên quốc gia. 'LO'/'Local' cho IP nội bộ; null nếu không tra được.
    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
