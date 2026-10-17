package com.project_exam.backend.modules.admin.gamification.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;

import com.project_exam.backend.modules.gamification.quest.dto.QuestRequest;
import com.project_exam.backend.modules.gamification.quest.dto.QuestResponse;
import com.project_exam.backend.modules.gamification.quest.service.QuestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequirePermission(PermissionCatalog.QUEST_MANAGE)
@RequestMapping("/api/admin/quests")
@RequiredArgsConstructor
public class QuestAdminController {

    private final QuestService questService;

    @GetMapping
    public ResponseEntity<List<QuestResponse>> getAll() {
        return ResponseEntity.ok(questService.findAll());
    }

    @PostMapping
    public ResponseEntity<QuestResponse> create(
            @Valid @RequestBody QuestRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questService.create(request));
    }

    @PutMapping("/{questId}")
    public ResponseEntity<QuestResponse> update(
            @PathVariable String questId,
            @Valid @RequestBody QuestRequest request
    ) {
        return ResponseEntity.ok(questService.update(questId, request));
    }

    @DeleteMapping("/{questId}")
    public ResponseEntity<Void> delete(@PathVariable String questId) {
        questService.delete(questId);
        return ResponseEntity.noContent().build();
    }
}
