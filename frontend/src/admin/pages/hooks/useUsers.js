import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {keepPreviousData} from '~/shared/config/queryClient';
import {getRoles} from '~/api/roleApi';
import {deleteUser, getUsers} from '~/api/userApi';

export const usersKeys = {
  list: (params) => ['admin-users', params],
  roles: () => ['admin-roles'],
};

const normalizeUser = (user) => ({
  user_id: String(user.userId ?? user.user_id ?? user.id ?? ''),
  user_name: user.userName ?? user.user_name ?? user.username ?? '',
  full_name: user.fullName ?? user.full_name ?? user.username ?? '',
  email: user.email ?? '',
  role_id: String(user.roleId ?? user.role_id ?? ''),
  verified:
    typeof user.verified === 'boolean'
      ? user.verified
      : user.isVerified ?? null,
  created_at: user.createdAt ?? user.created_at ?? null,
});

const normalizeUsersPage = (userPage) => ({
  users: (userPage?.content || []).map(normalizeUser),
  totalElements: userPage?.totalElements || 0,
  totalPages: Math.max(userPage?.totalPages || 1, 1),
});

const normalizeRoles = (rolesData) =>
  (Array.isArray(rolesData) ? rolesData : []).map((role) => ({
    role_id: String(role.roleId),
    role_name: role.roleName || '',
    description: role.description || '',
  }));

export function useUsers({page, size, keyword, roleId, verified}) {
  const queryClient = useQueryClient();

  const params = {
    page: Math.max(page - 1, 0),
    size,
    keyword,
    roleId,
    verified,
  };

  const usersQuery = useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => getUsers(params),
    select: normalizeUsersPage,
    placeholderData: keepPreviousData,
  });

  const rolesQuery = useQuery({
    queryKey: usersKeys.roles(),
    queryFn: getRoles,
    select: normalizeRoles,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin-users']});
    },
  });

  const usersData = usersQuery.data ?? {users: [], totalElements: 0, totalPages: 1};

  return {
    users: usersData.users,
    totalElements: usersData.totalElements,
    totalPages: usersData.totalPages,
    roles: rolesQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    usersIsError: usersQuery.isError,
    rolesIsError: rolesQuery.isError,
    deleteUserMutation,
  };
}
