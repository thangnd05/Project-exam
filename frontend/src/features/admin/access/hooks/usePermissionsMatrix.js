'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {getRoles, updateRolePermissions} from '~/shared/api/roleApi';
import {getPermissions} from '~/shared/api/permissionApi';
import {CURRENT_USER_QUERY_KEY} from '~/shared/context/AuthContext';

export const permissionsKeys = {
  roles: () => ['admin-roles'],
  permissions: () => ['admin-permissions'],
};

const EMPTY_ARRAY = [];

const asArray = (data) => (Array.isArray(data) ? data : []);

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
    mutationFn: ({dirtyRoleIds, matrix}) =>
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
