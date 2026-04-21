package com.project_exam.backend.services.ExamAndTest;

import com.project_exam.backend.dto.request.TestPartRequest;
import com.project_exam.backend.models.TestPart;
import com.project_exam.backend.repositories.TestPartRepository;
import com.project_exam.backend.repositories.TestRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import java.util.Optional;

@Service
@AllArgsConstructor
public class TestPartService {

    private final TestPartRepository testPartRepository;
    private final TestRepository testRepository;

    public List<TestPart> findAll() {
        return testPartRepository.findAll();
    }

    public Optional<TestPart> findById(String id) {
        return testPartRepository.findById(id);
    }

    public List<TestPart> findByTestId(String testId) {
        return testPartRepository.findByTestId(testId);
    }

    @Transactional
    public TestPart save(TestPartRequest dto) {
        // Kiểm tra logic trước khi lưu
        if (dto.getTestId() == null) {
            throw new RuntimeException("Test ID không được để trống!");
        }

        if (!testRepository.existsById(dto.getTestId())) {
            throw new RuntimeException("Bài test không tồn tại!");
        }

        // Map từ DTO sang Entity
        TestPart testPart = new TestPart();
        testPart.setTestId(dto.getTestId());
        testPart.setExamPartId(dto.getExamPartId());
        testPart.setNumQuestions(dto.getNumQuestions());

        return testPartRepository.save(testPart);
    }

    @Transactional
    public TestPart update(String id, TestPartRequest dto) {
        TestPart existing = testPartRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Part để cập nhật"));

        existing.setExamPartId(dto.getExamPartId());
        existing.setNumQuestions(dto.getNumQuestions());
        // Thường không update testId vì nó cố định theo đề

        return testPartRepository.save(existing);
    }

    public void deleteById(String id) {
        testPartRepository.deleteById(id);
    }
}