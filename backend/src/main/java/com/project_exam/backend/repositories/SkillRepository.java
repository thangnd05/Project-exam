package com.project_exam.backend.repositories;

import com.project_exam.backend.models.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, String> {
    boolean existsByName(String name);
}
