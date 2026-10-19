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
  ApiError,
  AuthMessageResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResetTokenStatus,
  UserResponse,
} from '@/app/types';

const resetTokenKey = (token: string) => ['auth', 'reset-token', token] as const;

export function useLoginMutation(
  options: Omit<UseMutationOptions<UserResponse, ApiError, LoginRequest>, 'mutationFn'> = {},
) {
  return useMutation({
    mutationFn: login,
    ...options,
  });
}

export function useRegisterMutation(
  options: Omit<UseMutationOptions<AuthMessageResponse, ApiError, RegisterRequest>, 'mutationFn'> = {},
) {
  return useMutation({
    mutationFn: register,
    ...options,
  });
}

export function useForgotPasswordMutation(
  options: Omit<UseMutationOptions<AuthMessageResponse, ApiError, string>, 'mutationFn'> = {},
) {
  return useMutation({
    mutationFn: forgotPassword,
    ...options,
  });
}

export function useResetPasswordMutation(
  options: Omit<UseMutationOptions<AuthMessageResponse, ApiError, ResetPasswordRequest>, 'mutationFn'> = {},
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
    queryKey: resetTokenKey(token),
    queryFn: () => checkResetToken(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function fetchCurrentUser() {
  return getCurrentUser();
}
