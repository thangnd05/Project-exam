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
        UserTarget ut = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId)
                .orElseThrow(() -> new NotFoundException("Chưa đặt mục tiêu cho loại đề này"));
        return toResponse(ut);
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
            ut.setTargetScore(request.getTargetScore());
            ut = userTargetRepository.save(ut);
        } else {
            ut = new UserTarget();
            ut.setUserId(userId);
            ut.setExamTypeId(request.getExamTypeId());
            ut.setTargetScore(request.getTargetScore());
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
        UserTargetResponse res = new UserTargetResponse();
        res.setUserTargetId(ut.getUserTargetId());
        res.setUserId(ut.getUserId());
        res.setExamTypeId(ut.getExamTypeId());
        res.setTargetScore(ut.getTargetScore());

        List<UserTargetPart> savedParts = userTargetPartRepository
                .findByUserTargetId(ut.getUserTargetId());

        List<UserTargetPartResponse> partResponses = savedParts.stream().map(p -> {
            UserTargetPartResponse pr = new UserTargetPartResponse();
            pr.setExamPartId(p.getExamPartId());
            pr.setRequiredPercentage(p.getCustomPercentage());
            return pr;
        }).collect(Collectors.toList());

        res.setPartRequirements(partResponses);
        return res;
    }
}
