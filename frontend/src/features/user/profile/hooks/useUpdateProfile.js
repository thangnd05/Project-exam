import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyInfo, updateUser } from '~/shared/api/userApi';

export const profileKeys = {
  me: () => ['my-info'],
};

export function useMyInfo(enabled) {
  const query = useQuery({
    queryKey: profileKeys.me(),
    queryFn: getMyInfo,
    enabled: !!enabled,
  });

  return {
    userInfo: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, formData }) => updateUser(userId, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.me() }),
  });
}
