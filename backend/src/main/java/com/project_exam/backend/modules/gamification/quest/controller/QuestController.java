package com.project_exam.backend.modules.gamification.quest.controller;

import com.project_exam.backend.modules.gamification.quest.dto.QuestClaimResponse;
import com.project_exam.backend.modules.gamification.quest.dto.UserQuestResponse;
import com.project_exam.backend.modules.gamification.quest.service.QuestService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
public class QuestController {

    private final QuestService questService;
    private final AuthUtils authUtils;

    @GetMapping("/me")
    public ResponseEntity<List<UserQuestResponse>> getMyQuests(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(questService.getAvailableForUser(userId));
    }

    @PostMapping("/{questId}/claim")
    public ResponseEntity<QuestClaimResponse> claim(
            @PathVariable String questId,
            HttpServletRequest httpRequest
    ) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(questService.claim(userId, questId));
    }
}
