'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
  updateRolePermissions,
} from '@/app/apis/roleApi';
import {getPermissions} from '@/app/apis/permissionApi';
import {useAdminCrud} from '@/app/features/admin/hooks/useAdminCrud';
import {CURRENT_USER_QUERY_KEY} from '@/app/contexts/AuthContext';

export const roleKeys = {
  roles: ['admin-roles'],
  permissions: ['admin-permissions'],
};

export const mapRoleFromApi = (role) => ({
  role_id: String(role.roleId),
  role_name: role.roleName || '',
  description: role.description || '',
  permissions: Array.isArray(role.permissions) ? role.permissions : [],
});

const normalizePermissions = (data) => (Array.isArray(data) ? data : []);

export function useRoles() {
  const qc = useQueryClient();

  const crud = useAdminCrud({
    queryKey: roleKeys.roles,
    list: getRoles,
    create: createRole,
    update: ({id, payload}) => updateRole(id, payload),
    remove: (id) => deleteRole(id),
    mapItem: mapRoleFromApi,
  });

  const permissionsQuery = useQuery({
    queryKey: roleKeys.permissions,
    queryFn: getPermissions,
    select: normalizePermissions,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({id, codes}) => updateRolePermissions(id, codes),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: roleKeys.roles});
      // Quyền của chính mình có thể vừa đổi  nạp lại /me để menu/route khớp với backend.
      qc.invalidateQueries({queryKey: CURRENT_USER_QUERY_KEY});
    },
  });

  return {
    roleList: crud.items,
    permissionCatalog: permissionsQuery.data ?? [],
    isLoading: crud.isLoading,
    createRoleMutation: crud.createMutation,
    updateRoleMutation: crud.updateMutation,
    deleteRoleMutation: crud.deleteMutation,
    updatePermissionsMutation,
  };
}
