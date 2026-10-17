package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.modules.admin.exam.controller.AnswerAdminController;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.service.AnswerService;
import com.project_exam.backend.shared.security.PermissionCatalog;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

/**
 * Chạy method security thật trên AnswerAdminController: class khai ANSWER_MANAGE,
 * hai endpoint GET ghi đè bằng ANSWER_VIEW.
 */
@SpringJUnitConfig(RequirePermissionMethodSecurityTest.Config.class)
class RequirePermissionMethodSecurityTest {

    @Configuration
    @Import(MethodSecurityConfig.class)
    static class Config {
        @Bean
        AnswerService answerService() {
            return mock(AnswerService.class);
        }

        @Bean
        AnswerAdminController answerAdminController(AnswerService answerService) {
            return new AnswerAdminController(answerService);
        }
    }

    @Autowired
    private AnswerAdminController controller;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private static void loginWith(String... authorities) {
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken("admin@example.com", null, authorities));
    }

    @Test
    @DisplayName("Có quyền ở method (ANSWER_VIEW) → gọi được endpoint GET")
    void methodLevelPermissionAllows() {
        loginWith(PermissionCatalog.ANSWER_VIEW);
        assertDoesNotThrow(() -> controller.getAllAnswer());
    }

    @Test
    @DisplayName("Chỉ có ANSWER_VIEW → bị chặn ở endpoint dùng quyền class (ANSWER_MANAGE)")
    void classLevelPermissionDenies() {
        loginWith(PermissionCatalog.ANSWER_VIEW);
        assertThrows(AccessDeniedException.class, () -> controller.createAnswer(new AnswerRequest()));
    }

    @Test
    @DisplayName("Có ANSWER_MANAGE → gọi được endpoint dùng quyền class")
    void classLevelPermissionAllows() {
        loginWith(PermissionCatalog.ANSWER_MANAGE);
        assertDoesNotThrow(() -> controller.createAnswer(new AnswerRequest()));
    }

    @Test
    @DisplayName("Method ghi đè class: chỉ có ANSWER_MANAGE vẫn không xem được endpoint cần ANSWER_VIEW")
    void methodLevelOverridesClassLevel() {
        loginWith(PermissionCatalog.ANSWER_MANAGE);
        assertThrows(AccessDeniedException.class, () -> controller.getAnswersByQuestion("q1"));
    }

    @Test
    @DisplayName("Không có quyền nào → bị chặn")
    void noAuthorityDenied() {
        loginWith();
        assertThrows(AccessDeniedException.class, () -> controller.getAllAnswer());
    }
}
