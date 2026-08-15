'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { buyCosmetic, equipCosmetic, unequipCosmetic } from '@/app/apis/cosmeticApi';
import { COINS_QUERY_KEY } from '@/app/contexts/CoinContext';
import { EQUIPPED_COSMETICS_QUERY_KEY } from '@/app/contexts/CosmeticContext';
import type { CosmeticResponse } from '@/app/types';

// error để any có chủ đích: consumer đọc error?.response?.data?.message theo shape của axios.
type MutationCallbacks<TData> = Pick<
  UseMutationOptions<TData, any, string>,
  'onSuccess' | 'onError'
>;

export function useBuyCosmetic(
  { onSuccess, onError }: MutationCallbacks<CosmeticResponse> = {},
): UseMutationResult<CosmeticResponse, any, string> {
  const qc = useQueryClient();
  return useMutation<CosmeticResponse, any, string>({
    mutationFn: (cosmeticId: string) => buyCosmetic(cosmeticId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: COINS_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useEquipCosmetic(
  { onSuccess, onError }: MutationCallbacks<void> = {},
): UseMutationResult<void, any, string> {
  const qc = useQueryClient();
  return useMutation<void, any, string>({
    mutationFn: (cosmeticId: string) => equipCosmetic(cosmeticId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: EQUIPPED_COSMETICS_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useUnequipCosmetic(
  { onSuccess, onError }: MutationCallbacks<void> = {},
): UseMutationResult<void, any, string> {
  const qc = useQueryClient();
  return useMutation<void, any, string>({
    mutationFn: (cosmeticId: string) => unequipCosmetic(cosmeticId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: EQUIPPED_COSMETICS_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}
