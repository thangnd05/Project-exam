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
import {useAdminCrud} from '@/app/hooks/useAdminCrud';
import {CURRENT_USER_QUERY_KEY} from '@/app/contexts/AuthContext';
import type {PermissionResponse, RoleRequest, RoleResponse} from '@/app/types';

export interface AdminRoleRow {
  role_id: string;
  role_name: string;
  description: string;
  permissions: string[];
}

export const roleKeys = {
  roles: ['admin-roles'],
  permissions: ['admin-permissions'],
};

export const mapRoleFromApi = (role: RoleResponse): AdminRoleRow => ({
  role_id: String(role.roleId),
  role_name: role.roleName || '',
  description: role.description || '',
  permissions: Array.isArray(role.permissions) ? role.permissions : [],
});

const normalizePermissions = (data: PermissionResponse[]) => (Array.isArray(data) ? data : []);

export function useRoles() {
  const qc = useQueryClient();

  const crud = useAdminCrud({
    queryKey: roleKeys.roles,
    list: getRoles,
    create: createRole,
    update: ({id, payload}: {id: string; payload: RoleRequest}) => updateRole(id, payload),
    remove: (id: string) => deleteRole(id),
    mapItem: mapRoleFromApi,
  });

  const permissionsQuery = useQuery({
    queryKey: roleKeys.permissions,
    queryFn: getPermissions,
    select: normalizePermissions,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({id, codes}: {id: string; codes: string[]}) => updateRolePermissions(id, codes),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: roleKeys.roles});
      qc.invalidateQueries({queryKey: CURRENT_USER_QUERY_KEY});
    },
  });

  return {
    roleList: crud.items as AdminRoleRow[],
    permissionCatalog: permissionsQuery.data ?? [],
    isLoading: crud.isLoading,
    createRoleMutation: crud.createMutation,
    updateRoleMutation: crud.updateMutation,
    deleteRoleMutation: crud.deleteMutation,
    updatePermissionsMutation,
  };
}
