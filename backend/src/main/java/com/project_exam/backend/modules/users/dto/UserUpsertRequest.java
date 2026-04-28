package com.project_exam.backend.modules.users.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserUpsertRequest {
    private String userName;
    private String fullName;
    private String email;
    private String password;
    private String roleId;
    private Boolean verified;
}
