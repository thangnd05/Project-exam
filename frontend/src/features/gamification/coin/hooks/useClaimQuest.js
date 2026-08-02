import { useMutation, useQueryClient } from '@tanstack/react-query';
import { claimQuest, QUESTS_QUERY_KEY } from '~/shared/api/questApi';
import { COINS_QUERY_KEY } from '~/shared/context/CoinContext';

export function useClaimQuest({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questId) => claimQuest(questId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: COINS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: QUESTS_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}
