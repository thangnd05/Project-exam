package com.project_exam.backend.modules.users.rbac.service;

import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.NotFoundException;

import com.project_exam.backend.modules.users.rbac.dto.RoleRequest;
import com.project_exam.backend.modules.users.rbac.dto.RoleResponse;
import com.project_exam.backend.modules.users.rbac.domain.Permission;
import com.project_exam.backend.modules.users.rbac.domain.Role;
import com.project_exam.backend.modules.users.rbac.domain.RolePermission;
import com.project_exam.backend.modules.users.rbac.mapper.RoleMapper;
import com.project_exam.backend.modules.users.rbac.repository.PermissionRepository;
import com.project_exam.backend.modules.users.rbac.repository.RolePermissionRepository;
import com.project_exam.backend.modules.users.rbac.repository.RoleRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final RoleMapper roleMapper;

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

    @Transactional
    public void delete(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role không tồn tại"));
        // Gỡ các liên kết permission trước khi xóa role để không để lại dòng mồ côi.
        rolePermissionRepository.deleteByRoleId(id);
        roleRepository.delete(role);
    }

    /** Gán lại toàn bộ permission cho role theo danh sách code (replace, không cộng dồn). */
    @Transactional
    public RoleResponse updatePermissions(String roleId, List<String> codes) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role không tồn tại"));
        rolePermissionRepository.deleteByRoleId(roleId);
        if (codes != null) {
            for (String code : codes.stream().distinct().toList()) {
                Permission permission = permissionRepository.findByCode(code)
                        .orElseThrow(() -> new BadRequestException("Permission không tồn tại: " + code));
                rolePermissionRepository.save(RolePermission.builder()
                        .roleId(roleId)
                        .permissionId(permission.getPermissionId())
                        .build());
            }
        }
        return toResponse(role);
    }

    private RoleResponse toResponse(Role role) {
        RoleResponse response = roleMapper.toResponse(role);
        response.setPermissions(rolePermissionRepository.findPermissionCodesByRoleId(role.getRoleId()));
        return response;
    }
}
