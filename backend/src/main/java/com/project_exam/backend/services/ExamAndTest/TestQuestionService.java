package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.dto.request.TestQuestionRequest;
import com.project_exam.backend.dto.response.TestQuestionResponse;
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

    private TestQuestionResponse toResponse(TestQuestion testQuestion) {
        return new TestQuestionResponse(
                testQuestion.getTestQuestionId(),
                testQuestion.getTestPartId(),
                testQuestion.getQuestionId()
        );
    }

    private TestQuestion toEntity(TestQuestionRequest request) {
        TestQuestion testQuestion = new TestQuestion();
        testQuestion.setTestPartId(request.getTestPartId());
        testQuestion.setQuestionId(request.getQuestionId());
        return testQuestion;
    }

    public List<TestQuestion> getAllTestQuestions() {
        return testQuestionRepository.findAll();
    }

    public List<TestQuestionResponse> getAllTestQuestionResponses() {
        return getAllTestQuestions().stream()
                .map(this::toResponse)
                .toList();
    }

    public Optional<TestQuestion> getTestQuestionById(String id) {
        return testQuestionRepository.findById(id);
    }

    public Optional<TestQuestionResponse> getTestQuestionResponseById(String id) {
        return getTestQuestionById(id).map(this::toResponse);
    }

    public TestQuestion saveTestQuestion(TestQuestion testQuestion) {
        return testQuestionRepository.save(testQuestion);
    }

    public TestQuestionResponse createTestQuestion(TestQuestionRequest request) {
        return toResponse(saveTestQuestion(toEntity(request)));
    }

    public Optional<TestQuestionResponse> updateTestQuestion(String id, TestQuestionRequest request) {
        return getTestQuestionById(id)
                .map(existing -> {
                    TestQuestion updatedTestQuestion = toEntity(request);
                    updatedTestQuestion.setTestQuestionId(id);
                    return toResponse(saveTestQuestion(updatedTestQuestion));
                });
    }

    public void deleteTestQuestionById(String id) {
        testQuestionRepository.deleteById(id);
    }
}
