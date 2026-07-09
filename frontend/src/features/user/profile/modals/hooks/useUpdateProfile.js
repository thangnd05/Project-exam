import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyInfo, updateUser } from '~/shared/api/userApi';

export const profileKeys = {
  me: () => ['my-info'],
};

export function useMyInfo(enabled) {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: getMyInfo,
    enabled: !!enabled,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, formData }) => updateUser(userId, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.me() }),
  });
}
