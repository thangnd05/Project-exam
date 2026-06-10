package com.project_exam.backend.modules.gamification.cosmetic.repository;

import com.project_exam.backend.modules.gamification.cosmetic.domain.Cosmetic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CosmeticRepository extends JpaRepository<Cosmetic, String> {
    List<Cosmetic> findAllByOrderByDisplayOrderAscCreatedAtAsc();

    List<Cosmetic> findByActiveTrueOrderByDisplayOrderAscCreatedAtAsc();
}
