package com.project_exam.backend.infrastructure.persistence;

import org.hibernate.annotations.IdGeneratorType;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.METHOD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Đánh dấu khóa chính dùng generator UUID v7 (time-ordered).
 *
 * <p>Thay cho {@code @GeneratedValue(strategy = GenerationType.UUID)} (vốn sinh v4 random).</p>
 *
 * <pre>
 * &#64;Id
 * &#64;UuidV7
 * private String userId;
 * </pre>
 */
@IdGeneratorType(UuidV7Generator.class)
@Retention(RUNTIME)
@Target({FIELD, METHOD})
public @interface UuidV7 {
}
