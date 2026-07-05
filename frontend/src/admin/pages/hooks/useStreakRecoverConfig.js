import { useQuery, useMutation } from '@tanstack/react-query';

import { getStreakRecoverConfig, updateStreakRecoverConfig } from '~/api/streakApi';

export const streakRecoverKeys = { config: ['streak-recover-config'] };

export function useStreakRecoverConfig() {
  const configQuery = useQuery({
    queryKey: streakRecoverKeys.config,
    queryFn: getStreakRecoverConfig,
  });

  const updateMutation = useMutation({ mutationFn: updateStreakRecoverConfig });

  return {
    config: configQuery.data ?? null,
    isLoading: configQuery.isLoading,
    isError: configQuery.isError,
    updateConfig: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  };
}
