package com.project_exam.backend.modules.admin.classroom.controller;

import com.project_exam.backend.modules.classroom.chapter.dto.ChapterRequest;
import com.project_exam.backend.modules.classroom.chapter.dto.ChapterResponse;
import com.project_exam.backend.modules.classroom.chapter.service.ChapterService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.http.HttpStatus;

/**
 * Mặt quản trị của chapters, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/chapters")
@RequiredArgsConstructor
public class ChapterAdminController {

    private final ChapterService chapterService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<ChapterResponse>> getAll() {
        authUtils.requirePermission(PermissionCatalog.CLASS_MANAGE);
        return ResponseEntity.ok(chapterService.getAll());
    }
}
