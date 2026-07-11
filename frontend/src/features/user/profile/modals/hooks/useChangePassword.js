import { useMutation } from '@tanstack/react-query';
import { changePassword } from '~/shared/api/authApi';

export function useChangePassword({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: (payload) => changePassword(payload),
    onSuccess,
    onError,
  });
}
