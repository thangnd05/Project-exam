'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {getRoles, updateRolePermissions} from '@/app/apis/roleApi';
import {getPermissions} from '@/app/apis/permissionApi';
import {CURRENT_USER_QUERY_KEY} from '@/app/contexts/AuthContext';
import {EMPTY_LIST} from '@/app/utils/stableEmpty';
import {toList} from '@/app/utils/toList';

export type PermissionMatrix = Record<string, Set<string>>;

export const permissionsKeys = {
  roles: () => ['admin-roles'],
  permissions: () => ['admin-permissions'],
};

export function usePermissionsMatrix() {
  const qc = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: permissionsKeys.roles(),
    queryFn: getRoles,
    select: toList,
  });

  const permissionsQuery = useQuery({
    queryKey: permissionsKeys.permissions(),
    queryFn: getPermissions,
    select: toList,
  });

  const saveMutation = useMutation({
    mutationFn: ({dirtyRoleIds, matrix}: {dirtyRoleIds: string[]; matrix: PermissionMatrix}) =>
      Promise.all(
        dirtyRoleIds.map((roleId) =>
          updateRolePermissions(roleId, Array.from(matrix[roleId] || [])),
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: permissionsKeys.roles()});
      qc.invalidateQueries({queryKey: CURRENT_USER_QUERY_KEY});
    },
  });

  return {
    roles: rolesQuery.data ?? EMPTY_LIST,
    permissions: permissionsQuery.data ?? EMPTY_LIST,
    isLoading: rolesQuery.isLoading || permissionsQuery.isLoading,
    isError: rolesQuery.isError || permissionsQuery.isError,
    saveMutation,
  };
}
