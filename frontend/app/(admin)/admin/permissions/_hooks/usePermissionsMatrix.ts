'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {getRoles, updateRolePermissions} from '@/app/apis/roleApi';
import {getPermissions} from '@/app/apis/permissionApi';
import {CURRENT_USER_QUERY_KEY} from '@/app/contexts/AuthContext';

/** Ma trận quyền theo vai trò: roleId -> tập code quyền được tick. */
export type PermissionMatrix = Record<string, Set<string>>;

export const permissionsKeys = {
  roles: () => ['admin-roles'],
  permissions: () => ['admin-permissions'],
};

const EMPTY_ARRAY: never[] = [];

const asArray = <T,>(data: T[]): T[] => (Array.isArray(data) ? data : []);

export function usePermissionsMatrix() {
  const qc = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: permissionsKeys.roles(),
    queryFn: getRoles,
    select: asArray,
  });

  const permissionsQuery = useQuery({
    queryKey: permissionsKeys.permissions(),
    queryFn: getPermissions,
    select: asArray,
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
      // Nếu vừa sửa chính vai trò của mình thì backend đã đổi quyền ngay, nhưng sidebar và
      // ProtectedRoute vẫn đang dùng danh sách quyền lấy lúc đăng nhập  nạp lại /me cho khớp.
      qc.invalidateQueries({queryKey: CURRENT_USER_QUERY_KEY});
    },
  });

  return {
    roles: rolesQuery.data ?? EMPTY_ARRAY,
    permissions: permissionsQuery.data ?? EMPTY_ARRAY,
    isLoading: rolesQuery.isLoading || permissionsQuery.isLoading,
    isError: rolesQuery.isError || permissionsQuery.isError,
    saveMutation,
  };
}
