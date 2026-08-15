'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getStreakRecoverConfig, updateStreakRecoverConfig } from '~/shared/api/streakApi';

export const streakRecoverKeys = { config: ['streak-recover-config'] };

export function useStreakRecoverConfig() {
  const qc = useQueryClient();

  const configQuery = useQuery({
    queryKey: streakRecoverKeys.config,
    queryFn: getStreakRecoverConfig,
  });

  const updateMutation = useMutation({
    mutationFn: updateStreakRecoverConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: streakRecoverKeys.config }),
  });

  return {
    config: configQuery.data ?? null,
    isLoading: configQuery.isLoading,
    isError: configQuery.isError,
    updateConfig: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  };
}
