'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  forgotPassword,
  getCurrentUser,
  login,
  register,
  resetPassword,
  // [TẮT XÁC THỰC EMAIL] verifyEmail,
} from '~/shared/api/authApi';
import { CURRENT_USER_QUERY_KEY } from '~/shared/context/AuthContext';

export const authKeys = {
  currentUser: CURRENT_USER_QUERY_KEY,
};

export function useLoginMutation(options = {}) {
  return useMutation({
    mutationFn: login,
    ...options,
  });
}

export function useRegisterMutation(options = {}) {
  return useMutation({
    mutationFn: register,
    ...options,
  });
}

export function useForgotPasswordMutation(options = {}) {
  return useMutation({
    mutationFn: forgotPassword,
    ...options,
  });
}

export function useResetPasswordMutation(options = {}) {
  return useMutation({
    mutationFn: ({ token, newPassword }) => resetPassword(token, newPassword),
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

export function useCurrentUserQuery(options = {}) {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: getCurrentUser,
    ...options,
  });
}

export function fetchCurrentUser() {
  return getCurrentUser();
}
