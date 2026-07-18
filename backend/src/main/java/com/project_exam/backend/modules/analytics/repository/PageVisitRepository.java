package com.project_exam.backend.modules.analytics.repository;

import com.project_exam.backend.modules.analytics.domain.PageVisit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PageVisitRepository extends JpaRepository<PageVisit, String> {

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    /** (createdAt, userId) của các lượt xem từ :from — dựng biểu đồ theo giờ, tách khách vs user. */
    @Query("SELECT v.createdAt, v.userId FROM PageVisit v WHERE v.createdAt >= :from")
    List<Object[]> findVisitsSince(@Param("from") LocalDateTime from);

    /**
     * (sessionKey, createdAt, userId) đã sort theo phiên rồi thời gian — để gom thành "phiên truy cập"
     * theo quy tắc nghỉ 30 phút (mỗi lần vào web tính 1 lượt, không cộng theo từng trang).
     */
    @Query("SELECT v.sessionKey, v.createdAt, v.userId FROM PageVisit v WHERE v.createdAt >= :from "
            + "ORDER BY v.sessionKey, v.createdAt")
    List<Object[]> findSessionRowsSince(@Param("from") LocalDateTime from);

    /** Như trên nhưng giới hạn trong khoảng [from, to) — dùng khi xem lượt truy cập của một ngày cụ thể. */
    @Query("SELECT v.sessionKey, v.createdAt, v.userId FROM PageVisit v "
            + "WHERE v.createdAt >= :from AND v.createdAt < :to ORDER BY v.sessionKey, v.createdAt")
    List<Object[]> findSessionRowsBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /**
     * Quốc gia truy cập thật từ :from — (code, name, count) đã sort giảm dần.
     * Gom theo MÃ quốc gia (không theo tên) để các cách viết khác nhau của cùng 1 nước
     * (vd "Vietnam" vs "VietNam") không bị tách thành nhiều dòng; tên lấy đại diện bằng MIN.
     * BỎ IP nội bộ ('LO'/Local) và IP không tra được (countryCode null) — chúng không phải quốc gia,
     * không lên bản đồ được và không nên chiếm chỗ của quốc gia thật.
     */
    @Query("SELECT v.countryCode, MIN(v.country), COUNT(v) "
            + "FROM PageVisit v WHERE v.createdAt >= :from "
            + "AND v.countryCode IS NOT NULL AND v.countryCode <> 'LO' "
            + "GROUP BY v.countryCode ORDER BY COUNT(v) DESC")
    List<Object[]> findTopCountriesSince(@Param("from") LocalDateTime from, Pageable pageable);
}
