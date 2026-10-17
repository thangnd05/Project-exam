package com.project_exam.backend.modules.admin.classroom.controller;

import com.project_exam.backend.modules.classroom.chapter.dto.ChapterResponse;
import com.project_exam.backend.modules.classroom.chapter.service.ChapterService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequirePermission(PermissionCatalog.CLASS_MANAGE)
@RequestMapping("/api/admin/chapters")
@RequiredArgsConstructor
public class ChapterAdminController {

    private final ChapterService chapterService;

    @GetMapping
    public ResponseEntity<List<ChapterResponse>> getAll() {
        return ResponseEntity.ok(chapterService.getAll());
    }
}
