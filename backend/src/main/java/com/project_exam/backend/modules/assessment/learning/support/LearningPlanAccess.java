package com.project_exam.backend.modules.assessment.learning.support;

import com.project_exam.backend.modules.assessment.learning.domain.LearningPlan;
import com.project_exam.backend.modules.assessment.learning.repository.LearningPlanRepository;
import com.project_exam.backend.shared.exception.ForbiddenException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Objects;

/** Kiểm tra quyền sở hữu kế hoạch học  dùng chung cho mọi service của learning. */
@Component
@RequiredArgsConstructor
public class LearningPlanAccess {

    private final LearningPlanRepository planRepository;

    public LearningPlan requireOwnedPlan(String userId, String learningPlanId) {
        LearningPlan plan = planRepository.findById(learningPlanId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kế hoạch học"));
        if (!Objects.equals(plan.getUserId(), userId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập kế hoạch này");
        }
        return plan;
    }
}
