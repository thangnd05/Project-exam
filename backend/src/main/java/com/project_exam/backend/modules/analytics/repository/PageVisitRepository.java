package com.project_exam.backend.modules.analytics.repository;

import com.project_exam.backend.modules.analytics.domain.PageVisit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PageVisitRepository extends JpaRepository<PageVisit, String> {

    long countByCreatedAtBetween(Instant start, Instant end);

    /** Xoá hàng loạt các lượt xem cũ hơn :cutoff (retention) — trả về số dòng đã xoá. */
    @Modifying
    @Query("DELETE FROM PageVisit v WHERE v.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") Instant cutoff);

    /**
     * (sessionKey, createdAt, userId) đã sort theo phiên rồi thời gian — để gom thành "phiên truy cập"
     * theo quy tắc nghỉ 30 phút (mỗi lần vào web tính 1 lượt, không cộng theo từng trang).
     *
     * <p>sessionKey = analyticsVisitorId: mã khách/thiết bị ỔN ĐỊNH, KHÔNG đổi khi login/logout.
     * Nhờ vậy cùng 1 trình duyệt luôn gom về 1 phiên — guest lướt rồi đăng nhập, hay logout/login,
     * đều không bị tách thành lượt mới. (Không ghép userId để tránh dòng userId=null lúc logout
     * tách khoá làm phát sinh lượt ảo.)
     */
    @Query("SELECT v.sessionKey, v.createdAt, v.userId FROM PageVisit v WHERE v.createdAt >= :from "
            + "ORDER BY v.sessionKey, v.createdAt")
    List<Object[]> findSessionRowsSince(@Param("from") Instant from);

    /** Như trên nhưng giới hạn trong khoảng [from, to) — dùng khi xem lượt truy cập của một ngày cụ thể. */
    @Query("SELECT v.sessionKey, v.createdAt, v.userId FROM PageVisit v "
            + "WHERE v.createdAt >= :from AND v.createdAt < :to ORDER BY v.sessionKey, v.createdAt")
    List<Object[]> findSessionRowsBetween(@Param("from") Instant from, @Param("to") Instant to);

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
    List<Object[]> findTopCountriesSince(@Param("from") Instant from, Pageable pageable);
}
