package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerAdminResponse;
import com.project_exam.backend.modules.assessment.test.dto.AnswerResponse;
import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.mapper.AnswerMapper;
import com.project_exam.backend.modules.assessment.exam.repository.AnswerRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnswerService {
    private final AnswerRepository answerRepository;
    private final AnswerMapper answerMapper;

    private AnswerAdminResponse toAdminResponse(Answer answer) {
        return answerMapper.toAdminResponse(answer);
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

        List<Answer> existingInDb = answerRepository.findByQuestionId(questionId);

        Map<String, Answer> dbMap = existingInDb.stream()
                .collect(Collectors.toMap(Answer::getAnswerId, a -> a));

        Set<String> idsToKeep = requests.stream()
                .map(AnswerRequest::getAnswerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Answer> toDelete = existingInDb.stream()
                .filter(a -> !idsToKeep.contains(a.getAnswerId()))
                .collect(Collectors.toList());
        if (!toDelete.isEmpty()) {
            answerRepository.deleteAll(toDelete);
        }

        List<Answer> results = new ArrayList<>();
        for (AnswerRequest req : requests) {
            Answer answer;
            if (req.getAnswerId() != null && dbMap.containsKey(req.getAnswerId())) {

                answer = dbMap.get(req.getAnswerId());
            } else {

                answer = new Answer();
                answer.setQuestionId(questionId);
            }

            answer.setAnswerText(req.getAnswerText());
            answer.setIsCorrect(req.getIsCorrect() != null ? req.getIsCorrect() : false);
            answer.setAnswerLabel(req.getAnswerLabel());

            results.add(answerRepository.save(answer));
        }

        return results;
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
                        Answer::getQuestionId,
                        Collectors.mapping(
                                answerMapper::toResponse,
                                Collectors.collectingAndThen(
                                        Collectors.toList(),
                                        list -> list.stream()
                                                .sorted(Comparator.comparing(AnswerResponse::getAnswerLabel,
                                                        Comparator.nullsLast(String::compareTo)))
                                                .toList()
                                )
                        )
                ));
    }

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
                                answerMapper::toAdminResponse,
                                Collectors.collectingAndThen(
                                        Collectors.toList(),
                                        list -> list.stream()
                                                .sorted(Comparator.comparing(AnswerAdminResponse::getAnswerLabel,
                                                        Comparator.nullsLast(String::compareTo)))
                                                .toList()
                                )
                        )
                ));
    }
}
