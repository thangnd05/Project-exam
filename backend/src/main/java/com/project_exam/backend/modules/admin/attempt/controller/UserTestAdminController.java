package com.project_exam.backend.modules.admin.attempt.controller;

import com.project_exam.backend.modules.assessment.attempt.dto.ClaimGuestTestsResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.ActiveUserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.StartUserTestRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.StartUserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestUpdateRequest;
import com.project_exam.backend.modules.assessment.attempt.dto.UserTestResponse;
import com.project_exam.backend.modules.assessment.attempt.dto.TestLeaderboardResponse;
import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import com.project_exam.backend.modules.assessment.attempt.service.TestReviewService;
import com.project_exam.backend.modules.assessment.attempt.service.UserTestService;
import com.project_exam.backend.modules.assessment.test.dto.TestAdminResponse;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Mặt quản trị của user-tests, tách khỏi controller dùng chung theo khuôn
 * QuestAdminController/CoinAdminController: cùng module, cùng service và
 * repository, chỉ tách controller theo đối tượng dùng. Mọi method ở đây đều
 * cần quyền nên khó sót requirePermission hơn là trộn với endpoint người dùng.
 */
@RestController
@RequestMapping("/api/admin/user-tests")
@RequiredArgsConstructor
public class UserTestAdminController {

    private final UserTestService userTestService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<List<UserTestResponse>> getAll() {
        authUtils.requirePermission(PermissionCatalog.ATTEMPT_MANAGE);
        return ResponseEntity.ok(userTestService.findAllResponses());
    }
}
