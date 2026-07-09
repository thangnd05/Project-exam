import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
  updateRolePermissions,
} from '~/features/admin/api/roleApi';
import {getPermissions} from '~/features/admin/api/permissionApi';

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

const normalizeRoles = (data) =>
  (Array.isArray(data) ? data : []).map(mapRoleFromApi);

const normalizePermissions = (data) => (Array.isArray(data) ? data : []);

export function useRoles() {
  const qc = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: roleKeys.roles,
    queryFn: getRoles,
    select: normalizeRoles,
  });

  const permissionsQuery = useQuery({
    queryKey: roleKeys.permissions,
    queryFn: getPermissions,
    select: normalizePermissions,
  });

  const invalidateRoles = () =>
    qc.invalidateQueries({queryKey: roleKeys.roles});

  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: invalidateRoles,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({id, payload}) => updateRole(id, payload),
    onSuccess: invalidateRoles,
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => deleteRole(id),
    onSuccess: invalidateRoles,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({id, codes}) => updateRolePermissions(id, codes),
    onSuccess: invalidateRoles,
  });

  return {
    roleList: rolesQuery.data ?? [],
    permissionCatalog: permissionsQuery.data ?? [],
    loading: rolesQuery.isLoading,
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation,
    updatePermissionsMutation,
  };
}
