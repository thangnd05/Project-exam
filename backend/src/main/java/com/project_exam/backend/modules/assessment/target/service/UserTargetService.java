package com.project_exam.backend.modules.assessment.target.service;

import com.project_exam.backend.modules.assessment.target.domain.TargetPartRequirement;
import com.project_exam.backend.modules.assessment.target.domain.UserTarget;
import com.project_exam.backend.modules.assessment.target.domain.UserTargetPart;
import com.project_exam.backend.modules.assessment.target.dto.UserPartRequirementRequest;
import com.project_exam.backend.modules.assessment.target.dto.UserTargetPartResponse;
import com.project_exam.backend.modules.assessment.target.dto.UserTargetRequest;
import com.project_exam.backend.modules.assessment.target.dto.UserTargetResponse;
import com.project_exam.backend.modules.assessment.target.mapper.UserTargetMapper;
import com.project_exam.backend.modules.assessment.target.repository.ExamTargetMilestoneRepository;
import com.project_exam.backend.modules.assessment.target.repository.TargetPartRequirementRepository;
import com.project_exam.backend.modules.assessment.target.repository.UserTargetPartRepository;
import com.project_exam.backend.modules.assessment.target.repository.UserTargetRepository;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserTargetService {

    private final UserTargetRepository userTargetRepository;
    private final UserTargetPartRepository userTargetPartRepository;
    private final ExamTargetMilestoneRepository milestoneRepository;
    private final TargetPartRequirementRepository partRequirementRepository;
    private final UserTargetMapper userTargetMapper;

    public UserTargetResponse getByUserAndExamType(String userId, String examTypeId) {
        return userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId)
                .map(this::toResponse)
                .orElseGet(this::emptyResponse);
    }

    private UserTargetResponse emptyResponse() {
        return userTargetMapper.toEmptyResponse();
    }

    @Transactional
    public UserTargetResponse createOrUpdate(String userId, UserTargetRequest request) {
        Optional<UserTarget> existing = userTargetRepository
                .findByUserIdAndExamTypeId(userId, request.getExamTypeId());

        UserTarget ut;
        if (existing.isPresent()) {
            ut = existing.get();
            Integer oldScore = ut.getTargetScore();
            ut.setTargetScore(request.getTargetScore());
            ut.setTargetReadiness(request.getTargetReadiness());
            // Mục tiêu mới cao hơn reset trạng thái đã đạt để theo dõi lại.
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

        syncParts(ut.getUserTargetId(), request.getCustomParts());

        return toResponse(ut);
    }

    @Transactional
    public void delete(String userId, String examTypeId) {
        UserTarget ut = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId)
                .orElseThrow(() -> new NotFoundException("Chưa đặt mục tiêu cho loại đề này"));
        userTargetPartRepository.deleteByUserTargetId(ut.getUserTargetId());
        userTargetRepository.delete(ut);
    }

    /**
     * Ngưỡng % cần đạt từng Part để dùng làm ngưỡng vượt ải: ưu tiên aim user tự đặt,
     * chưa có thì lấy mốc mục tiêu admin cấu hình cho đúng điểm target của user.
     */
    public Map<String, Integer> getEffectiveRequirements(String userId, String examTypeId) {
        Optional<UserTarget> utOpt = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId);
        if (utOpt.isEmpty()) return Map.of();

        UserTarget ut = utOpt.get();
        Map<String, Integer> userAims = userTargetPartRepository
                .findByUserTargetId(ut.getUserTargetId()).stream()
                .filter(p -> p.getExamPartId() != null && p.getCustomPercentage() != null)
                .collect(Collectors.toMap(
                        UserTargetPart::getExamPartId,
                        UserTargetPart::getCustomPercentage,
                        (a, b) -> a));
        if (!userAims.isEmpty()) {
            return userAims;
        }
        return milestoneRequirements(examTypeId, ut.getTargetScore());
    }

    /** Yêu cầu từng Part của mốc điểm do admin cấu hình (rỗng nếu không có mốc khớp). */
    private Map<String, Integer> milestoneRequirements(String examTypeId, Integer targetScore) {
        if (targetScore == null) {
            return Map.of();
        }
        return milestoneRepository.findByExamTypeIdAndMilestoneScore(examTypeId, targetScore)
                .map(m -> partRequirementRepository
                        .findByExamTargetMilestoneId(m.getExamTargetMilestoneId()).stream()
                        .filter(r -> r.getExamPartId() != null && r.getRequiredPercentage() != null)
                        .collect(Collectors.toMap(
                                TargetPartRequirement::getExamPartId,
                                TargetPartRequirement::getRequiredPercentage,
                                (a, b) -> a)))
                .orElseGet(Map::of);
    }

    private void syncParts(String userTargetId, List<UserPartRequirementRequest> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return;
        }
        List<UserTargetPart> existingParts = userTargetPartRepository.findByUserTargetId(userTargetId);
        Map<String, UserTargetPart> byPartId = existingParts.stream()
                .collect(Collectors.toMap(UserTargetPart::getExamPartId, p -> p, (a, b) -> a));

        List<UserTargetPart> toSave = new ArrayList<>();
        Map<String, UserTargetPart> kept = new HashMap<>();
        for (UserPartRequirementRequest dto : dtos) {
            if (dto.getExamPartId() == null) {
                continue;
            }
            UserTargetPart p = byPartId.get(dto.getExamPartId());
            if (p == null) {
                p = new UserTargetPart();
                p.setUserTargetId(userTargetId);
                p.setExamPartId(dto.getExamPartId());
            }
            p.setCustomPercentage(dto.getCustomPercentage());
            kept.put(dto.getExamPartId(), p);
            toSave.add(p);
        }

        // Xoá Part không còn được chọn, và cả bản ghi trùng examPartId (nếu dữ liệu cũ có).
        List<UserTargetPart> stale = existingParts.stream()
                .filter(p -> kept.get(p.getExamPartId()) != p)
                .toList();
        if (!stale.isEmpty()) {
            userTargetPartRepository.deleteAll(stale);
            userTargetPartRepository.flush();
        }
        userTargetPartRepository.saveAll(toSave);
    }

    private UserTargetResponse toResponse(UserTarget ut) {
        List<UserTargetPart> savedParts = userTargetPartRepository
                .findByUserTargetId(ut.getUserTargetId());

        List<UserTargetPartResponse> partResponses = savedParts.stream()
                .map(userTargetMapper::toPartResponse)
                .collect(Collectors.toList());

        return userTargetMapper.toResponse(ut, partResponses);
    }
}
