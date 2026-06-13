package com.project_exam.backend.modules.assessment.target.service;

import com.project_exam.backend.modules.assessment.target.domain.*;
import com.project_exam.backend.modules.assessment.target.dto.*;
import com.project_exam.backend.modules.assessment.target.repository.*;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserTargetService {

    private final UserTargetRepository userTargetRepository;
    private final UserTargetPartRepository userTargetPartRepository;

    public UserTargetResponse getByUserAndExamType(String userId, String examTypeId) {
        return userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId)
                .map(this::toResponse)
                .orElseGet(this::emptyResponse);
    }

    private UserTargetResponse emptyResponse() {
        return UserTargetResponse.builder()
                .hasTarget(false)
                .partRequirements(List.of())
                .build();
    }

    @Transactional
    public UserTargetResponse createOrUpdate(String userId, UserTargetRequest request) {
        Optional<UserTarget> existing = userTargetRepository
                .findByUserIdAndExamTypeId(userId, request.getExamTypeId());

        UserTarget ut;
        if (existing.isPresent()) {
            ut = existing.get();
            userTargetPartRepository.deleteByUserTargetId(ut.getUserTargetId());
            userTargetPartRepository.flush();
            Integer oldScore = ut.getTargetScore();
            ut.setTargetScore(request.getTargetScore());
            ut.setTargetReadiness(request.getTargetReadiness());
            // Mục tiêu mới cao hơn → reset trạng thái đã đạt để theo dõi lại.
            if (oldScore == null || !Objects.equals(oldScore, request.getTargetScore())) {
                ut.setAchievedAt(null);
            }
            ut = userTargetRepository.save(ut);
        } else {
            ut = new UserTarget();
            ut.setUserId(userId);
            ut.setExamTypeId(request.getExamTypeId());
            ut.setTargetScore(request.getTargetScore());
            ut.setTargetReadiness(request.getTargetReadiness());
            ut = userTargetRepository.save(ut);
        }

        if (request.getCustomParts() != null && !request.getCustomParts().isEmpty()) {
            saveParts(ut.getUserTargetId(), request.getCustomParts());
        }

        return toResponse(ut);
    }

    @Transactional
    public void delete(String userId, String examTypeId) {
        UserTarget ut = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId)
                .orElseThrow(() -> new NotFoundException("Chưa đặt mục tiêu cho loại đề này"));
        userTargetPartRepository.deleteByUserTargetId(ut.getUserTargetId());
        userTargetRepository.delete(ut);
    }

    public Map<String, Integer> getEffectiveRequirements(String userId, String examTypeId) {
        Optional<UserTarget> utOpt = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId);
        if (utOpt.isEmpty()) return Map.of();

        List<UserTargetPart> parts = userTargetPartRepository
                .findByUserTargetId(utOpt.get().getUserTargetId());
        return parts.stream().collect(Collectors.toMap(
                UserTargetPart::getExamPartId,
                UserTargetPart::getCustomPercentage
        ));
    }

    private void saveParts(String userTargetId, List<UserPartRequirementDto> dtos) {
        List<UserTargetPart> entities = new ArrayList<>();
        for (UserPartRequirementDto dto : dtos) {
            UserTargetPart p = new UserTargetPart();
            p.setUserTargetId(userTargetId);
            p.setExamPartId(dto.getExamPartId());
            p.setCustomPercentage(dto.getCustomPercentage());
            entities.add(p);
        }
        userTargetPartRepository.saveAll(entities);
    }

    private UserTargetResponse toResponse(UserTarget ut) {
        List<UserTargetPart> savedParts = userTargetPartRepository
                .findByUserTargetId(ut.getUserTargetId());

        List<UserTargetPartResponse> partResponses = savedParts.stream().map(p ->
                UserTargetPartResponse.builder()
                        .examPartId(p.getExamPartId())
                        .requiredPercentage(p.getCustomPercentage())
                        .currentScore(p.getCurrentScore())
                        .lastUserTestId(p.getLastUserTestId())
                        .build()
        ).collect(Collectors.toList());

        return UserTargetResponse.builder()
                .hasTarget(true)
                .userTargetId(ut.getUserTargetId())
                .userId(ut.getUserId())
                .examTypeId(ut.getExamTypeId())
                .targetScore(ut.getTargetScore())
                .targetReadiness(ut.getTargetReadiness())
                .achievedAt(ut.getAchievedAt())
                .partRequirements(partResponses)
                .build();
    }
}
