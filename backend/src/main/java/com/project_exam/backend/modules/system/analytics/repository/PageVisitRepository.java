package com.project_exam.backend.modules.system.analytics.repository;

import com.project_exam.backend.modules.system.analytics.domain.PageVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Mỗi dòng page_visits = 1 lượt truy cập (phiên). FE chỉ ping khi bắt đầu phiên mới.
 */
@Repository
public interface PageVisitRepository extends JpaRepository<PageVisit, String> {

    long countByCreatedAtGreaterThanEqual(Instant from);

    boolean existsBySessionKeyAndCreatedAtAfter(String sessionKey, Instant after);

    @Modifying
    @Query("DELETE FROM PageVisit v WHERE v.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") Instant cutoff);

    @Query("SELECT v.createdAt FROM PageVisit v WHERE v.createdAt >= :from AND v.createdAt < :to")
    List<Instant> findCreatedAtBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT v.countryCode, MIN(v.country), COUNT(v) "
            + "FROM PageVisit v WHERE v.createdAt >= :from AND v.createdAt < :to "
            + "AND v.countryCode IS NOT NULL AND v.countryCode <> 'LO' "
            + "GROUP BY v.countryCode")
    List<Object[]> countByCountryBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT MIN(v.createdAt) FROM PageVisit v")
    Instant findEarliestCreatedAt();
}
