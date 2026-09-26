package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.domain.UserTestAccess;
import com.project_exam.backend.modules.assessment.test.repository.UserTestAccessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TestAccessPolicy {

    private final UserTestAccessRepository userTestAccessRepository;

    public boolean hasAccess(Test test, String userId) {
        if (isFree(test)) return true;
        if (userId == null) return false;
        if (userId.equals(test.getCreatedBy())) return true;
        return userTestAccessRepository.existsByUserIdAndTestId(userId, test.getTestId());
    }

    public boolean hasAccess(Test test, String userId, Set<String> purchasedTestIds) {
        if (isFree(test)) return true;
        if (userId == null) return false;
        if (userId.equals(test.getCreatedBy())) return true;
        return purchasedTestIds.contains(test.getTestId());
    }

    public Set<String> purchasedTestIds(String userId) {
        if (userId == null) return Set.of();
        return userTestAccessRepository.findByUserId(userId).stream()
                .map(UserTestAccess::getTestId)
                .collect(Collectors.toSet());
    }

    private boolean isFree(Test test) {
        return test.getCostCoins() == null || test.getCostCoins() <= 0;
    }
}
