package com.project_exam.backend.modules.assessment.target.service;

import com.project_exam.backend.modules.assessment.attempt.dto.EnhancedResultDto;
import com.project_exam.backend.modules.assessment.attempt.dto.PartBreakdownDto;
import com.project_exam.backend.modules.assessment.target.domain.UserTarget;
import com.project_exam.backend.modules.assessment.target.domain.UserTargetPart;
import com.project_exam.backend.modules.assessment.target.repository.UserTargetPartRepository;
import com.project_exam.backend.modules.assessment.target.repository.UserTargetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Cập nhật điểm Part từ mock — tách khỏi aim ({@code customPercentage}) và khỏi plan ải.
 */
@Service
@RequiredArgsConstructor
public class UserTargetProgressService {

    private final UserTargetRepository userTargetRepository;
    private final UserTargetPartRepository userTargetPartRepository;

    private static final String QUICK_CHALLENGE_CODE = "QUICK_CHALLENGE";

    @Transactional
    public void syncPartScoresFromMock(
            String userId,
            String examTypeId,
            String userTestId,
            Instant finishedAt,
            EnhancedResultDto result) {
        if (result == null || QUICK_CHALLENGE_CODE.equals(result.getExamCategoryCode())) {
            return;
        }
        List<PartBreakdownDto> partBreakdown = result.getPartBreakdown();
        if (partBreakdown == null || partBreakdown.isEmpty()) {
            return;
        }
        Optional<UserTarget> targetOpt = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId);
        if (targetOpt.isEmpty()) {
            return;
        }
        String userTargetId = targetOpt.get().getUserTargetId();
        Map<String, UserTargetPart> byPartId = userTargetPartRepository.findByUserTargetId(userTargetId)
                .stream()
                .collect(Collectors.toMap(UserTargetPart::getExamPartId, p -> p, (a, b) -> a));

        List<UserTargetPart> changed = new ArrayList<>();
        for (PartBreakdownDto part : partBreakdown) {
            if (part.getExamPartId() == null) {
                continue;
            }
            UserTargetPart row = byPartId.get(part.getExamPartId());
            if (row == null || isStale(row, finishedAt)) {
                continue;
            }
            row.setCurrentScore(BigDecimal.valueOf(part.getPercentage()).setScale(2, RoundingMode.HALF_UP));
            row.setLastUserTestId(userTestId);
            row.setUpdatedAt(Instant.now());
            changed.add(row);
        }
        userTargetPartRepository.saveAll(changed);
    }

    private boolean isStale(UserTargetPart row, Instant finishedAt) {
        return row.getCurrentScore() != null
                && finishedAt != null
                && row.getUpdatedAt() != null
                && row.getUpdatedAt().isAfter(finishedAt);
    }

    @Transactional
    public boolean markTargetAchievedIfMet(String userId, String examTypeId, EnhancedResultDto result) {
        if (!result.isHasTarget() || !Boolean.TRUE.equals(result.getIsTargetMet())) {
            return false;
        }
        Optional<UserTarget> targetOpt = userTargetRepository.findByUserIdAndExamTypeId(userId, examTypeId);
        if (targetOpt.isEmpty()) {
            return false;
        }
        UserTarget target = targetOpt.get();
        if (target.getAchievedAt() != null) {
            return true;
        }
        target.setAchievedAt(Instant.now());
        userTargetRepository.save(target);
        return true;
    }
}
