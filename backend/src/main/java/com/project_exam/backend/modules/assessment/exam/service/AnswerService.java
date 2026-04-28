package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.repository.AnswerRepository;
import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnswerService {
    private final AnswerRepository answerRepository;

    private AnswerAdminResponse toAdminResponse(Answer answer) {
        return AnswerAdminResponse.builder()
                .answerId(answer.getAnswerId())
                .answerText(answer.getAnswerText())
                .answerLabel(answer.getAnswerLabel())
                .isCorrect(answer.getIsCorrect())
                .build();
    }

    private Answer toEntity(AnswerRequest request, String questionId) {
        Answer answer = new Answer();
        answer.setQuestionId(questionId);
        answer.setAnswerText(request.getAnswerText());
        answer.setAnswerLabel(request.getAnswerLabel());
        answer.setIsCorrect(request.getIsCorrect());
        return answer;
    }

    @Transactional
    public List<Answer> syncAnswers(String questionId, List<AnswerRequest> requests) {
        if (requests == null) return new ArrayList<>();

        // 1. Lấy tất cả Answer hiện có của câu hỏi này trong DB
        List<Answer> existingInDb = answerRepository.findByQuestionId(questionId);

        // 2. Tạo Map để tra cứu nhanh Answer cũ theo ID (tăng hiệu năng)
        Map<String, Answer> dbMap = existingInDb.stream()
                .collect(Collectors.toMap(Answer::getAnswerId, a -> a));

        // 3. Xác định các ID mà Frontend muốn giữ lại
        Set<String> idsToKeep = requests.stream()
                .map(AnswerRequest::getAnswerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 4. XÓA: Những cái có trong DB nhưng không có trong danh sách gửi lên
        // (Nghĩa là người dùng đã xóa chúng trên giao diện)
        List<Answer> toDelete = existingInDb.stream()
                .filter(a -> !idsToKeep.contains(a.getAnswerId()))
                .collect(Collectors.toList());
        if (!toDelete.isEmpty()) {
            answerRepository.deleteAll(toDelete);
        }

        // 5. CẬP NHẬT hoặc THÊM MỚI
        List<Answer> results = new ArrayList<>();
        for (AnswerRequest req : requests) {
            Answer answer;
            if (req.getAnswerId() != null && dbMap.containsKey(req.getAnswerId())) {
                // Trường hợp UPDATE: Lấy object cũ từ Map ra để set lại giá trị
                answer = dbMap.get(req.getAnswerId());
            } else {
                // Trường hợp INSERT: Tạo mới hoàn toàn (do id null hoặc id không khớp)
                answer = new Answer();
                answer.setQuestionId(questionId);
            }

            // Map dữ liệu từ DTO vào Entity
            answer.setAnswerText(req.getAnswerText());
            answer.setIsCorrect(req.getIsCorrect() != null ? req.getIsCorrect() : false);
            answer.setAnswerLabel(req.getAnswerLabel());

            results.add(answerRepository.save(answer));
        }

        return results;
    }

    public AnswerService(AnswerRepository answerRepository) {
        this.answerRepository = answerRepository;
    }
    public List<Answer> findAll() {
        return answerRepository.findAll();
    }

    public List<AnswerAdminResponse> findAllResponses() {
        return findAll().stream()
                .map(this::toAdminResponse)
                .toList();
    }

    public List<Answer> findByQuestionId(String questionId) {
        return answerRepository.findByQuestionId(questionId);
    }

    public List<AnswerAdminResponse> findResponsesByQuestionId(String questionId) {
        return findByQuestionId(questionId).stream()
                .map(this::toAdminResponse)
                .toList();
    }

    public Answer save(Answer answer) {
        return answerRepository.save(answer);
    }

    public Optional<Answer> findById(String id) {
        return answerRepository.findById(id);
    }

    public AnswerAdminResponse createFromRequest(AnswerRequest request) {
        Answer saved = save(toEntity(request, request.getQuestionId()));
        return toAdminResponse(saved);
    }

    public Optional<AnswerAdminResponse> updateFromRequest(String id, AnswerRequest request) {
        return findById(id)
                .map(existing -> {
                    Answer updatedAnswer = toEntity(request, existing.getQuestionId());
                    updatedAnswer.setAnswerId(id);
                    return toAdminResponse(save(updatedAnswer));
                });
    }

    public void deleteById(String id) {
        answerRepository.deleteById(id);
    }

    public Map<String, List<AnswerResponse>> getAnswersForMultipleQuestions(List<String> questionIds) {

        if (questionIds == null || questionIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Answer> allAnswers = answerRepository.findByQuestionIdIn(questionIds);

        return allAnswers.stream()
                .collect(Collectors.groupingBy(
                        Answer::getQuestionId,   // 👈 group bằng entity trước
                        Collectors.mapping(
                                ans -> new AnswerResponse(
                                        ans.getAnswerId(),
                                        ans.getAnswerText(),
                                        ans.getAnswerLabel()
                                ),
                                Collectors.toList()
                        )
                ));
    }

    // Hàm helper (cần cải tiến nếu Answer không có questionId)
    private String findQuestionIdForAnswer(List<Answer> allAnswers, String answerId) {
        return allAnswers.stream()
                .filter(a -> a.getAnswerId().equals(answerId))
                .findFirst()
                .map(Answer::getQuestionId)
                .orElse(null);
    }

    public Map<String, List<AnswerAdminResponse>> getAnswersForMultipleQuestionsForAdmin(
            List<String> questionIds
    ) {

        if (questionIds == null || questionIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Answer> allAnswers = answerRepository.findByQuestionIdIn(questionIds);

        return allAnswers.stream()
                .collect(Collectors.groupingBy(
                        Answer::getQuestionId,
                        Collectors.mapping(
                                a -> AnswerAdminResponse.builder()
                                        .answerId(a.getAnswerId())
                                        .answerText(a.getAnswerText())
                                        .answerLabel(a.getAnswerLabel())
                                        .isCorrect(a.getIsCorrect())
                                        .build(),
                                Collectors.toList()
                        )
                ));
    }
}
