package com.project_exam.backend.modules.classroom.mapper;

import com.project_exam.backend.modules.classroom.domain.ClassEntity;
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
}
