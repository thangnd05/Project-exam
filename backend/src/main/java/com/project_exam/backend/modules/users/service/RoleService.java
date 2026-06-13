package com.project_exam.backend.modules.users.service;

import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.users.dto.RoleRequest;
import com.project_exam.backend.modules.users.dto.RoleResponse;
import com.project_exam.backend.modules.users.domain.Role;
import com.project_exam.backend.modules.users.repository.RoleRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public RoleResponse findById(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role không tồn tại"));
        return toResponse(role);
    }

    public RoleResponse create(RoleRequest request) {
        Role role = new Role();
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        role = roleRepository.save(role);
        return toResponse(role);
    }

    public RoleResponse update(String id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role không tồn tại"));
        if (request.getRoleName() != null) role.setRoleName(request.getRoleName());
        if (request.getDescription() != null) role.setDescription(request.getDescription());
        role = roleRepository.save(role);
        return toResponse(role);
    }

    public void delete(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role không tồn tại"));
        roleRepository.delete(role);
    }

    private RoleResponse toResponse(Role role) {
        return RoleResponse.builder()
                .roleId(role.getRoleId())
                .roleName(role.getRoleName())
                .description(role.getDescription())
                .build();
    }
}
