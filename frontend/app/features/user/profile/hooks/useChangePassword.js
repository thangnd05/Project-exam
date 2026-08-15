'use client';

import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@/app/apis/authApi';

export function useChangePassword({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: (payload) => changePassword(payload),
    onSuccess,
    onError,
  });
}
