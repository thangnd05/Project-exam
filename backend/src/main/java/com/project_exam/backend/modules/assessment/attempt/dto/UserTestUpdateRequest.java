package com.project_exam.backend.modules.assessment.attempt.dto;

import com.project_exam.backend.modules.assessment.attempt.domain.UserTest;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTestUpdateRequest {
    private UserTest.Status status;
}
