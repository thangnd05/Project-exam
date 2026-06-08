package com.project_exam.backend.modules.gamification.quest.controller;

import com.project_exam.backend.modules.gamification.quest.dto.QuestRequest;
import com.project_exam.backend.modules.gamification.quest.dto.QuestResponse;
import com.project_exam.backend.modules.gamification.quest.service.QuestService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Quản lý nhiệm vụ cho admin. */
@RestController
@RequestMapping("/api/admin/quests")
@AllArgsConstructor
public class QuestAdminController {

    private final QuestService questService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<QuestResponse>> getAll(HttpServletRequest httpRequest) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(questService.findAll());
    }

    @PostMapping
    public ResponseEntity<QuestResponse> create(
            @Valid @RequestBody QuestRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(questService.create(request));
    }

    @PutMapping("/{questId}")
    public ResponseEntity<QuestResponse> update(
            @PathVariable String questId,
            @Valid @RequestBody QuestRequest request,
            HttpServletRequest httpRequest
    ) {
        authUtils.requireAdmin(httpRequest);
        return ResponseEntity.ok(questService.update(questId, request));
    }

    @DeleteMapping("/{questId}")
    public ResponseEntity<Void> delete(@PathVariable String questId, HttpServletRequest httpRequest) {
        authUtils.requireAdmin(httpRequest);
        questService.delete(questId);
        return ResponseEntity.noContent().build();
    }
}
