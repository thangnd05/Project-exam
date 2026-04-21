package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.models.TestQuestion;
import com.project_exam.backend.repositories.TestQuestionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TestQuestionService {
    private final TestQuestionRepository testQuestionRepository;

    public TestQuestionService(TestQuestionRepository testQuestionRepository) {
        this.testQuestionRepository = testQuestionRepository;
    }

    public List<TestQuestion> getAllTestQuestions() {
        return testQuestionRepository.findAll();
    }

    public Optional<TestQuestion> getTestQuestionById(String id) {
        return testQuestionRepository.findById(id);
    }

    public TestQuestion saveTestQuestion(TestQuestion testQuestion) {
        return testQuestionRepository.save(testQuestion);
    }

    public void deleteTestQuestionById(String id) {
        testQuestionRepository.deleteById(id);
    }
}
