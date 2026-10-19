'use client';

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  checkResetToken,
  forgotPassword,
  getCurrentUser,
  login,
  register,
  resetPassword,
} from '@/app/apis/authApi';
import type {
  AuthMessageResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResetTokenStatus,
  UserResponse,
} from '@/app/types';
import { CURRENT_USER_QUERY_KEY } from '@/app/contexts/AuthContext';

export const authKeys = {
  currentUser: CURRENT_USER_QUERY_KEY,
  resetToken: (token: string) => ['auth', 'reset-token', token] as const,
};

export function useLoginMutation(
  options: Omit<UseMutationOptions<UserResponse, any, LoginRequest>, 'mutationFn'> = {},
) {
  return useMutation({
    mutationFn: login,
    ...options,
  });
}

export function useRegisterMutation(
  options: Omit<UseMutationOptions<AuthMessageResponse, any, RegisterRequest>, 'mutationFn'> = {},
) {
  return useMutation({
    mutationFn: register,
    ...options,
  });
}

export function useForgotPasswordMutation(
  options: Omit<UseMutationOptions<AuthMessageResponse, any, string>, 'mutationFn'> = {},
) {
  return useMutation({
    mutationFn: forgotPassword,
    ...options,
  });
}

export function useResetPasswordMutation(
  options: Omit<UseMutationOptions<AuthMessageResponse, any, ResetPasswordRequest>, 'mutationFn'> = {},
) {
  return useMutation({
    mutationFn: resetPassword,
    ...options,
  });
}

/** Kiem tra token trong link email truoc khi cho nhap mat khau moi. */
export function useResetTokenQuery(
  token: string,
  options: Omit<UseQueryOptions<ResetTokenStatus>, 'queryKey' | 'queryFn'> = {},
) {
  return useQuery({
    queryKey: authKeys.resetToken(token),
    queryFn: () => checkResetToken(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useCurrentUserQuery(
  options: Omit<UseQueryOptions<UserResponse>, 'queryKey' | 'queryFn'> = {},
) {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: getCurrentUser,
    ...options,
  });
}

export function fetchCurrentUser() {
  return getCurrentUser();
}
