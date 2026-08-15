'use client';

import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@/app/apis/authApi';
import type { AuthMessageResponse, ChangePasswordRequest } from '@/app/types';

interface ChangePasswordCallbacks {
  // error để any có chủ đích: lỗi axios (error.response) chưa có type dùng chung trong dự án
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
