'use client';

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  forgotPassword,
  getCurrentUser,
  login,
  register,
  resetPassword,
  // [TẮT XÁC THỰC EMAIL] verifyEmail,
} from '@/app/apis/authApi';
import type { AuthMessageResponse, LoginRequest, RegisterRequest, UserResponse } from '@/app/types';
import { CURRENT_USER_QUERY_KEY } from '@/app/contexts/AuthContext';

export const authKeys = {
  currentUser: CURRENT_USER_QUERY_KEY,
};

interface ResetPasswordVariables {
  token: string;
  newPassword: string;
}

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
  options: Omit<UseMutationOptions<AuthMessageResponse, any, ResetPasswordVariables>, 'mutationFn'> = {},
) {
  return useMutation({
    mutationFn: ({ token, newPassword }: ResetPasswordVariables) => resetPassword(token, newPassword),
    ...options,
  });
}

// [TẮT XÁC THỰC EMAIL]
// export function useVerifyEmailMutation(options = {}) {
//   return useMutation({
//     mutationFn: verifyEmail,
//     ...options,
//   });
// }

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
