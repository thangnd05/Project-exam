package com.project_exam.backend.modules.gamification.streak.controller;

import com.project_exam.backend.modules.gamification.streak.dto.StreakResponse;
import com.project_exam.backend.modules.gamification.streak.service.StreakService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/streak")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;
    private final AuthUtils authUtils;

    @GetMapping("/me")
    public ResponseEntity<StreakResponse> getMyStreak(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(streakService.getStreak(userId));
    }

    @PostMapping("/restore")
    public ResponseEntity<StreakResponse> restore(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(streakService.restore(userId));
    }
}
