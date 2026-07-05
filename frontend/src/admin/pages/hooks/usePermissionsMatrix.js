import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {getRoles, updateRolePermissions} from '../../../api/roleApi';
import {getPermissions} from '../../../api/permissionApi';

export const permissionsKeys = {
  roles: () => ['admin-roles'],
  permissions: () => ['admin-permissions'],
};

// Ref ổn định để tránh tạo mảng rỗng mới mỗi render (giữ deps của effect seed ổn định).
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

  // Lưu nhiều role đã đổi trong một lần; giữ nguyên chữ ký updateRolePermissions.
  const saveMutation = useMutation({
    mutationFn: ({dirtyRoleIds, matrix}) =>
      Promise.all(
        dirtyRoleIds.map((roleId) =>
          updateRolePermissions(roleId, Array.from(matrix[roleId] || [])),
        ),
      ),
    onSuccess: () => qc.invalidateQueries({queryKey: permissionsKeys.roles()}),
  });

  return {
    roles: rolesQuery.data ?? EMPTY_ARRAY,
    permissions: permissionsQuery.data ?? EMPTY_ARRAY,
    isLoading: rolesQuery.isLoading || permissionsQuery.isLoading,
    isError: rolesQuery.isError || permissionsQuery.isError,
    saveMutation,
  };
}
