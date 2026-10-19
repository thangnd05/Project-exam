'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyInfo, updateUser } from '@/app/apis/userApi';

export const profileKeys = {
  me: () => ['my-info'],
};

export function useMyInfo(enabled?: boolean) {
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

interface UpdateProfileVariables {
  userId: string;
  formData: FormData;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, formData }: UpdateProfileVariables) => updateUser(userId, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.me() }),
  });
}
