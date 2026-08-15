'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { claimQuest, QUESTS_QUERY_KEY } from '@/app/apis/questApi';
import { COINS_QUERY_KEY } from '@/app/contexts/CoinContext';
import type { QuestClaimResponse } from '@/app/types';

// error để any có chủ đích: consumer đọc error?.response?.data?.message theo shape của axios.
type UseClaimQuestOptions = Pick<
  UseMutationOptions<QuestClaimResponse, any, string>,
  'onSuccess' | 'onError'
>;

export function useClaimQuest(
  { onSuccess, onError }: UseClaimQuestOptions = {},
): UseMutationResult<QuestClaimResponse, any, string> {
  const qc = useQueryClient();
  return useMutation<QuestClaimResponse, any, string>({
    mutationFn: (questId: string) => claimQuest(questId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: COINS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: QUESTS_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}
