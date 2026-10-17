package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Mọi endpoint /api/admin/** phải khai quyền bằng @RequirePermission (hoặc @PreAuthorize)
 * ở method hoặc class. Quên khai → test fail thay vì endpoint lặng lẽ mở cho mọi user đã đăng nhập.
 */
class AdminEndpointPermissionTest {

    private static final String BASE_PACKAGE = "com.project_exam.backend";
    private static final String ADMIN_PATH_PREFIX = "/api/admin";

    private static final Set<String> KNOWN_PERMISSIONS = PermissionCatalog.ALL.stream()
            .map(PermissionCatalog.Def::code)
            .collect(Collectors.toSet());

    @Test
    @DisplayName("Mọi endpoint admin đều khai quyền hợp lệ và là method public")
    void everyAdminEndpointDeclaresPermission() {
        List<Class<?>> adminControllers = findAdminControllers();
        assertFalse(adminControllers.isEmpty(), "Không tìm thấy controller admin nào — kiểm tra lại BASE_PACKAGE");

        List<String> violations = new ArrayList<>();
        for (Class<?> controller : adminControllers) {
            for (Method method : controller.getDeclaredMethods()) {
                if (!AnnotatedElementUtils.hasAnnotation(method, RequestMapping.class)) continue;
                String where = controller.getSimpleName() + "#" + method.getName();

                // Method không public thì proxy của Spring Security không chặn được → @PreAuthorize vô tác dụng.
                if (!Modifier.isPublic(method.getModifiers())) {
                    violations.add(where + ": handler phải là public để @RequirePermission có hiệu lực");
                }

                RequirePermission permission = findPermission(method, controller);
                boolean hasPreAuthorize = AnnotatedElementUtils.hasAnnotation(method, PreAuthorize.class)
                        || AnnotatedElementUtils.hasAnnotation(controller, PreAuthorize.class);
                if (!hasPreAuthorize) {
                    violations.add(where + ": thiếu @RequirePermission ở method hoặc class");
                } else if (permission != null && !KNOWN_PERMISSIONS.contains(permission.value())) {
                    violations.add(where + ": mã quyền '" + permission.value() + "' không có trong PermissionCatalog");
                }
            }
        }

        assertTrue(violations.isEmpty(), "\nEndpoint admin chưa khai quyền đúng:\n  " + String.join("\n  ", violations) + "\n");
    }

    private static RequirePermission findPermission(Method method, Class<?> controller) {
        RequirePermission onMethod = AnnotatedElementUtils.findMergedAnnotation(method, RequirePermission.class);
        return onMethod != null ? onMethod : AnnotatedElementUtils.findMergedAnnotation(controller, RequirePermission.class);
    }

    private static List<Class<?>> findAdminControllers() {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

        List<Class<?>> result = new ArrayList<>();
        for (BeanDefinition candidate : scanner.findCandidateComponents(BASE_PACKAGE)) {
            Class<?> type = ClassUtils.resolveClassName(candidate.getBeanClassName(), AdminEndpointPermissionTest.class.getClassLoader());
            RequestMapping mapping = AnnotatedElementUtils.findMergedAnnotation(type, RequestMapping.class);
            boolean adminPath = mapping != null && Arrays.stream(mapping.path()).anyMatch(p -> p.startsWith(ADMIN_PATH_PREFIX));
            if (adminPath || type.getPackageName().contains(".modules.admin.")) {
                result.add(type);
            }
        }
        return result;
    }
}
