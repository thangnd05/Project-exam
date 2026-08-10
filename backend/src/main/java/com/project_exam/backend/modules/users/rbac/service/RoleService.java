package com.project_exam.backend.modules.users.rbac.service;

import com.project_exam.backend.modules.audit.service.AuditContext;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.ForbiddenException;
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
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleService {

    /**
     * Vai trò quản trị gốc. DataLoader gán lại toàn bộ quyền cho nó ở mỗi lần khởi động, nên
     * đây là đường thoát cuối nếu ai đó lỡ tay — không được phép đổi tên, xoá, hay gỡ quyền
     * của nó qua API, nếu không sẽ tự khoá cả hệ thống (sửa lại cũng cần ROLE:MANAGE).
     */
    private static final String PROTECTED_ROLE = "ADMIN";

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRepository userRepository;
    private final RoleAuthorityCache roleAuthorityCache;
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
        if (request.getRoleName() != null && !request.getRoleName().equals(role.getRoleName())) {
            requireNotProtected(role, "đổi tên");
            role.setRoleName(request.getRoleName());
        }
        if (request.getDescription() != null) role.setDescription(request.getDescription());
        role = roleRepository.save(role);
        return toResponse(role);
    }

    @Transactional
    public void delete(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role không tồn tại"));
        requireNotProtected(role, "xoá");

        // FK users.role_id là ON DELETE RESTRICT nên DB cũng chặn, nhưng lỗi ràng buộc thô
        // chỉ ra "vi phạm ràng buộc" — admin không biết vướng ở đâu.
        long inUse = userRepository.countByRoleId(id);
        if (inUse > 0) {
            throw new ConflictException(
                    "Còn " + inUse + " người dùng đang mang vai trò này. Hãy chuyển họ sang vai trò khác trước.");
        }

        rolePermissionRepository.deleteByRoleId(id);
        roleRepository.delete(role);
        roleAuthorityCache.invalidate(id);
        AuditContext.describe("Xoá vai trò '" + role.getRoleName() + "'");
    }

    @Transactional
    public RoleResponse updatePermissions(String roleId, List<String> codes) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role không tồn tại"));
        requireNotProtected(role, "đổi quyền");

        List<String> requested = codes == null ? List.of() : codes.stream().distinct().toList();
        Set<String> before = new LinkedHashSet<>(rolePermissionRepository.findPermissionCodesByRoleId(roleId));

        rolePermissionRepository.deleteByRoleId(roleId);
        for (String code : requested) {
            Permission permission = permissionRepository.findByCode(code)
                    .orElseThrow(() -> new BadRequestException("Permission không tồn tại: " + code));
            rolePermissionRepository.save(RolePermission.builder()
                    .roleId(roleId)
                    .permissionId(permission.getPermissionId())
                    .build());
        }

        roleAuthorityCache.invalidate(roleId);
        AuditContext.describe(describePermissionDiff(role.getRoleName(), before, new LinkedHashSet<>(requested)));
        return toResponse(role);
    }

    /** "Vai trò 'Trợ giảng': +TEST:MANAGE, +TAG:MANAGE, -POST:MODERATE" */
    private String describePermissionDiff(String roleName, Set<String> before, Set<String> after) {
        List<String> changes = new ArrayList<>();
        after.stream().filter(code -> !before.contains(code)).forEach(code -> changes.add("+" + code));
        before.stream().filter(code -> !after.contains(code)).forEach(code -> changes.add("-" + code));

        String prefix = "Vai trò '" + roleName + "': ";
        return changes.isEmpty() ? prefix + "không thay đổi quyền" : prefix + String.join(", ", changes);
    }

    private void requireNotProtected(Role role, String action) {
        if (PROTECTED_ROLE.equalsIgnoreCase(role.getRoleName())) {
            throw new ForbiddenException("Không thể " + action + " vai trò " + PROTECTED_ROLE + ".");
        }
    }

    private RoleResponse toResponse(Role role) {
        RoleResponse response = roleMapper.toResponse(role);
        response.setPermissions(rolePermissionRepository.findPermissionCodesByRoleId(role.getRoleId()));
        return response;
    }
}
