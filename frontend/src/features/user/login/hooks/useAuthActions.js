import { useMutation, useQuery } from '@tanstack/react-query';
import {
  forgotPassword,
  getCurrentUser,
  login,
  register,
  resetPassword,
  verifyEmail,
} from '~/shared/api/authApi';

export const authKeys = {
  currentUser: ['current-user'],
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

export function useVerifyEmailMutation(options = {}) {
  return useMutation({
    mutationFn: verifyEmail,
    ...options,
  });
}

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
