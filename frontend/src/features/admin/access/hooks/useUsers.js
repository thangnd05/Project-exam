'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {keepPreviousData} from '~/shared/config/queryClient';
import {getRoles} from '~/shared/api/roleApi';
import {createUser, deleteUser, getUsers, updateUser} from '~/shared/api/userApi';

export const usersKeys = {
  list: (params) => ['admin-users', params],
  stat: (scope) => ['admin-users', 'stat', scope],
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
  is_premium: user.isPremium === true || user.is_premium === true,
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

  const teacherRoleId = (rolesQuery.data ?? []).find(
    (role) => role.role_name === 'TEACHER',
  )?.role_id;

  const readTotal = (userPage) => userPage?.totalElements || 0;

  const totalStatQuery = useQuery({
    queryKey: usersKeys.stat('total'),
    queryFn: () => getUsers({page: 0, size: 1}),
    select: readTotal,
  });

  const verifiedStatQuery = useQuery({
    queryKey: usersKeys.stat('verified'),
    queryFn: () => getUsers({page: 0, size: 1, verified: true}),
    select: readTotal,
  });

  const teacherStatQuery = useQuery({
    queryKey: usersKeys.stat(`teacher:${teacherRoleId ?? ''}`),
    queryFn: () => getUsers({page: 0, size: 1, roleId: teacherRoleId}),
    enabled: Boolean(teacherRoleId),
    select: readTotal,
  });

  const createUserMutation = useMutation({
    mutationFn: (payload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin-users']});
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({userId, values}) => {
      const formData = new FormData();
      formData.append('user', JSON.stringify(values));
      return updateUser(userId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin-users']});
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin-users']});
    },
  });

  const usersData = usersQuery.data ?? {users: [], totalElements: 0, totalPages: 1};

  const verifiedCount = verifiedStatQuery.data ?? 0;
  const totalCount = totalStatQuery.data ?? 0;

  return {
    users: usersData.users,
    totalElements: usersData.totalElements,
    totalPages: usersData.totalPages,
    stats: {
      total: totalCount,
      teachers: teacherStatQuery.data ?? 0,
      verified: verifiedCount,
      unverified: Math.max(totalCount - verifiedCount, 0),
    },
    roles: rolesQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    usersIsError: usersQuery.isError,
    rolesIsError: rolesQuery.isError,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
  };
}
