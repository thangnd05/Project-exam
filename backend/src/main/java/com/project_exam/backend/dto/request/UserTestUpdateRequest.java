package com.project_exam.backend.dto.request;

import com.project_exam.backend.models.UserTest;
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
