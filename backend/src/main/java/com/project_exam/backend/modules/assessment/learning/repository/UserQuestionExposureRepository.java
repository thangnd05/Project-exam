package com.project_exam.backend.modules.assessment.learning.repository;

import com.project_exam.backend.modules.assessment.learning.domain.UserQuestionExposure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface UserQuestionExposureRepository extends JpaRepository<UserQuestionExposure, String> {

    List<UserQuestionExposure> findByUserIdAndQuestionIdIn(String userId, Collection<String> questionIds);

}
