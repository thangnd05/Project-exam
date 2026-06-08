package com.project_exam.backend.modules.gamification.quest.repository;

import com.project_exam.backend.modules.gamification.quest.domain.Quest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestRepository extends JpaRepository<Quest, String> {
    List<Quest> findAllByOrderByCreatedAtDesc();
}
