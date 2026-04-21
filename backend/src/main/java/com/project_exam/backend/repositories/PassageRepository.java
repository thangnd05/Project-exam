package com.project_exam.backend.repositories;

import com.project_exam.backend.models.Passage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PassageRepository extends JpaRepository<Passage, String> {
    @Query(value = "SELECT * FROM passages WHERE passage_type = :type ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<Passage> findRandomPassages(@Param("type") String type, @Param("limit") int limit);
}
