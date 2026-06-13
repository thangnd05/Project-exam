package com.project_exam.backend.modules.classroom.mapper;

import com.project_exam.backend.modules.classroom.domain.ClassEntity;
import com.project_exam.backend.modules.classroom.dto.ClassResponse;
import com.project_exam.backend.modules.classroom.dto.ClassSimpleResponse;
import com.project_exam.backend.modules.classroom.dto.ClassStudentResponse;
import org.springframework.stereotype.Component;

@Component
public class ClassMapper {

    /** teacherName được resolve ở service (cần truy DB) rồi truyền vào. */
    public ClassStudentResponse toStudentResponse(ClassEntity clazz, String teacherName) {
        return ClassStudentResponse.builder()
                .classId(clazz.getClassId())
                .classQr(clazz.getClassQr())
                .className(clazz.getClassName())
                .teacherName(teacherName)
                .build();
    }

    public ClassResponse toResponse(ClassEntity c) {
        return ClassResponse.builder()
                .classId(c.getClassId())
                .classQr(c.getClassQr())
                .className(c.getClassName())
                .description(c.getDescription())
                .teacherId(c.getTeacherId())
                .createdAt(c.getCreatedAt())
                .build();
    }

    public ClassSimpleResponse toSimpleResponse(ClassEntity c) {
        return ClassSimpleResponse.builder()
                .classId(c.getClassId())
                .classQr(c.getClassQr())
                .className(c.getClassName())
                .build();
    }
}
