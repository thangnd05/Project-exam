package com.project_exam.backend.modules.assessment.target.service;

import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
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
    private final ExamTargetMilestoneRepository milestoneRepository;
    private final TargetPartRequirementRepository partRequirementRepository;
    private final ExamPartRepository examPartRepository;

    public UserTargetResponse getByUserAndExamType(String userId, String examTypeId) {
        UserTarget ut = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId)
                .orElseThrow(() -> new NotFoundException("Chưa đặt mục tiêu cho loại đề này"));
        return toResponse(ut);
    }

    @Transactional
    public UserTargetResponse createOrUpdate(String userId, UserTargetRequest request) {
        // Try to match a milestone
        String milestoneId = request.getExamTargetMilestoneId();
        if (milestoneId == null) {
            // Auto-match: check if admin has a milestone with this exact score
            Optional<ExamTargetMilestone> autoMatch = milestoneRepository
                    .findByExamTypeIdAndMilestoneScore(request.getExamTypeId(), request.getTargetScore());
            milestoneId = autoMatch.map(ExamTargetMilestone::getExamTargetMilestoneId).orElse(null);
        }

        Optional<UserTarget> existing = userTargetRepository
                .findByUserIdAndExamTypeId(userId, request.getExamTypeId());

        UserTarget ut;
        if (existing.isPresent()) {
            ut = existing.get();
            userTargetPartRepository.deleteByUserTargetId(ut.getUserTargetId());
            userTargetPartRepository.flush();
            ut.setTargetScore(request.getTargetScore());
            ut.setExamTargetMilestoneId(milestoneId);
            ut = userTargetRepository.save(ut);
        } else {
            ut = new UserTarget();
            ut.setUserId(userId);
            ut.setExamTypeId(request.getExamTypeId());
            ut.setTargetScore(request.getTargetScore());
            ut.setExamTargetMilestoneId(milestoneId);
            ut = userTargetRepository.save(ut);
        }

        if (request.getCustomParts() != null && !request.getCustomParts().isEmpty()) {
            saveCustomParts(ut.getUserTargetId(), request.getCustomParts());
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

        UserTarget ut = utOpt.get();
        Map<String, Integer> result = new LinkedHashMap<>();

        // If milestone matched, get defaults from milestone config
        if (ut.getExamTargetMilestoneId() != null) {
            List<TargetPartRequirement> defaults = partRequirementRepository
                    .findByExamTargetMilestoneId(ut.getExamTargetMilestoneId());
            for (TargetPartRequirement d : defaults) {
                result.put(d.getExamPartId(), d.getRequiredPercentage());
            }
        }

        // If no milestone or missing parts, fill with even split
        if (result.isEmpty()) {
            List<ExamPart> parts = examPartRepository.findByExamTypeId(ut.getExamTypeId());
            int evenPct = calcEvenPercentage(ut.getTargetScore());
            for (ExamPart p : parts) {
                result.put(p.getExamPartId(), evenPct);
            }
        }

        // Override with user custom parts
        List<UserTargetPart> customParts = userTargetPartRepository
                .findByUserTargetId(ut.getUserTargetId());
        for (UserTargetPart cp : customParts) {
            result.put(cp.getExamPartId(), cp.getCustomPercentage());
        }

        return result;
    }

    private int calcEvenPercentage(int targetScore) {
        // Simple: targetScore / maxScore * 100 (assume max 990 for now)
        return Math.min(100, Math.round((float) targetScore / 990 * 100));
    }

    private void saveCustomParts(String userTargetId, List<UserPartRequirementDto> dtos) {
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
        res.setExamTargetMilestoneId(ut.getExamTargetMilestoneId());

        Map<String, Integer> defaultMap = new LinkedHashMap<>();

        if (ut.getExamTargetMilestoneId() != null) {
            ExamTargetMilestone milestone = milestoneRepository
                    .findById(ut.getExamTargetMilestoneId()).orElse(null);
            if (milestone != null) {
                res.setMilestoneScore(milestone.getMilestoneScore());
                res.setMilestoneDescription(milestone.getDescription());
                res.setMilestoneMatched(true);

                List<TargetPartRequirement> defaults = partRequirementRepository
                        .findByExamTargetMilestoneId(ut.getExamTargetMilestoneId());
                for (TargetPartRequirement d : defaults) {
                    defaultMap.put(d.getExamPartId(), d.getRequiredPercentage());
                }
            }
        }

        // If no milestone defaults, fill with even split
        if (defaultMap.isEmpty()) {
            res.setMilestoneMatched(false);
            List<ExamPart> parts = examPartRepository.findByExamTypeId(ut.getExamTypeId());
            int evenPct = calcEvenPercentage(ut.getTargetScore());
            for (ExamPart p : parts) {
                defaultMap.put(p.getExamPartId(), evenPct);
            }
        }

        // Get custom overrides
        List<UserTargetPart> customParts = userTargetPartRepository
                .findByUserTargetId(ut.getUserTargetId());
        Map<String, Integer> customMap = customParts.stream()
                .collect(Collectors.toMap(
                        UserTargetPart::getExamPartId,
                        UserTargetPart::getCustomPercentage
                ));

        List<UserTargetPartResponse> partResponses = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : defaultMap.entrySet()) {
            UserTargetPartResponse pr = new UserTargetPartResponse();
            pr.setExamPartId(entry.getKey());
            if (customMap.containsKey(entry.getKey())) {
                pr.setRequiredPercentage(customMap.get(entry.getKey()));
                pr.setCustomized(true);
            } else {
                pr.setRequiredPercentage(entry.getValue());
                pr.setCustomized(false);
            }
            partResponses.add(pr);
        }
        res.setPartRequirements(partResponses);

        return res;
    }
}
