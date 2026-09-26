package com.project_exam.backend.modules.users.rbac.service;

import com.project_exam.backend.modules.users.rbac.dto.PermissionResponse;
import com.project_exam.backend.modules.users.rbac.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;

    public List<PermissionResponse> findAll() {
        return permissionRepository.findAll().stream()
                .map(p -> PermissionResponse.builder()
                        .permissionId(p.getPermissionId())
                        .code(p.getCode())
                        .description(p.getDescription())
                        .groupName(p.getGroupName())
                        .build())
                .sorted(Comparator.comparing(PermissionResponse::getGroupName,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(PermissionResponse::getCode))
                .toList();
    }
}
