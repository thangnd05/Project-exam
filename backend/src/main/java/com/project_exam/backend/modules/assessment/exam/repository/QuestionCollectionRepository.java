package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.QuestionCollection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionCollectionRepository extends JpaRepository<QuestionCollection, String> {
}
