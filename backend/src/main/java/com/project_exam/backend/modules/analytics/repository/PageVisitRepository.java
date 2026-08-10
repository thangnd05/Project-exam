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

    @Modifying
    @Query("DELETE FROM PageVisit v WHERE v.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") Instant cutoff);

    @Query("SELECT v.sessionKey, v.createdAt, v.userId FROM PageVisit v WHERE v.createdAt >= :from "
            + "ORDER BY v.sessionKey, v.createdAt")
    List<Object[]> findSessionRowsSince(@Param("from") Instant from);

    @Query("SELECT v.sessionKey, v.createdAt, v.userId FROM PageVisit v "
            + "WHERE v.createdAt >= :from AND v.createdAt < :to ORDER BY v.sessionKey, v.createdAt")
    List<Object[]> findSessionRowsBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT v.countryCode, MIN(v.country), COUNT(v) "
            + "FROM PageVisit v WHERE v.createdAt >= :from "
            + "AND v.countryCode IS NOT NULL AND v.countryCode <> 'LO' "
            + "GROUP BY v.countryCode ORDER BY COUNT(v) DESC")
    List<Object[]> findTopCountriesSince(@Param("from") Instant from, Pageable pageable);

    @Query("SELECT v.sessionKey, v.createdAt, v.countryCode, v.country FROM PageVisit v "
            + "WHERE v.createdAt >= :from AND v.createdAt < :to ORDER BY v.sessionKey, v.createdAt")
    List<Object[]> findLocationRowsBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT MIN(v.createdAt) FROM PageVisit v")
    Instant findEarliestCreatedAt();
}
