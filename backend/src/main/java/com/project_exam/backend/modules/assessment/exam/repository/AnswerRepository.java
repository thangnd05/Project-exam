package com.project_exam.backend.modules.assessment.exam.repository;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, String> {

    // Lấy tất cả đáp án của 1 câu hỏi
    List<Answer> findByQuestionId(String questionId);

    // Lấy đáp án đúng duy nhất của 1 câu hỏi
    Optional<Answer> findByQuestionIdAndIsCorrectTrue(String questionId);

    // Lấy tất cả đáp án đúng của nhiều câu hỏi
    List<Answer> findByQuestionIdInAndIsCorrectTrue(List<String> questionIds);

    // Optional: kiểm tra đáp án theo question và answerId
    Optional<Answer> findByQuestionIdAndAnswerId(String questionId, String answerId);

    List<Answer> findByQuestionIdIn(List<String> questionIds);

    void deleteByQuestionId(String questionId);
}
