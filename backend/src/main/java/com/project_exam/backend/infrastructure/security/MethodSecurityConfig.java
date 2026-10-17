package com.project_exam.backend.infrastructure.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.annotation.AnnotationTemplateExpressionDefaults;

@Configuration
@EnableMethodSecurity
public class MethodSecurityConfig {

    /** Cho phép meta-annotation có tham số như @RequirePermission("{value}"). */
    @Bean
    static AnnotationTemplateExpressionDefaults annotationTemplateExpressionDefaults() {
        return new AnnotationTemplateExpressionDefaults();
    }
}
