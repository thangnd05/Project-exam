'use client';

import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@/app/apis/authApi';
import type { AuthMessageResponse, ChangePasswordRequest } from '@/app/types';

interface ChangePasswordCallbacks {
  onSuccess?: (data: AuthMessageResponse) => void;
  onError?: (error: any) => void;
}

export function useChangePassword({ onSuccess, onError }: ChangePasswordCallbacks = {}) {
  return useMutation<AuthMessageResponse, any, ChangePasswordRequest>({
    mutationFn: (payload) => changePassword(payload),
    onSuccess,
    onError,
  });
}
