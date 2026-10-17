package com.project_exam.backend.shared.security;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Yêu cầu người gọi có mã quyền trong {@link PermissionCatalog}, ví dụ
 * {@code @RequirePermission(PermissionCatalog.TEST_MANAGE)}.
 *
 * <p>Đặt ở class để áp cho mọi endpoint; đặt ở method để ghi đè quyền của class.
 * {@code {value}} được thay bằng mã quyền nhờ bean AnnotationTemplateExpressionDefaults
 * trong MethodSecurityConfig. Thiếu quyền → AccessDeniedException → 403.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("hasAuthority('{value}')")
public @interface RequirePermission {
    String value();
}
