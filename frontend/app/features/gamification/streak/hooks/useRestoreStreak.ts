'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { restoreStreak } from '@/app/apis/streakApi';
import { STREAK_QUERY_KEY } from '@/app/contexts/StreakContext';
import { COINS_QUERY_KEY } from '@/app/contexts/CoinContext';
import type { ApiError, StreakResponse } from '@/app/types';

type UseRestoreStreakOptions = Pick<
  UseMutationOptions<StreakResponse, ApiError, void>,
  'onSuccess' | 'onError'
>;

export function useRestoreStreak(
  { onSuccess, onError }: UseRestoreStreakOptions = {},
): UseMutationResult<StreakResponse, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<StreakResponse, ApiError, void>({
    mutationFn: () => restoreStreak(),
    onSuccess: (result, ...rest) => {

      qc.setQueryData(STREAK_QUERY_KEY, result);
      qc.invalidateQueries({ queryKey: STREAK_QUERY_KEY });

      qc.invalidateQueries({ queryKey: COINS_QUERY_KEY });
      if (onSuccess) onSuccess(result, ...rest);
    },
    onError,
  });
}
