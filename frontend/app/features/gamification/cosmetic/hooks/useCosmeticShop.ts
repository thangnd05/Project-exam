'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { buyCosmetic, equipCosmetic, unequipCosmetic } from '@/app/apis/cosmeticApi';
import { COINS_QUERY_KEY } from '@/app/contexts/CoinContext';
import { EQUIPPED_COSMETICS_QUERY_KEY } from '@/app/contexts/CosmeticContext';
import type { ApiError, CosmeticResponse } from '@/app/types';

// Danh sách vật phẩm kèm trạng thái owned/equipped của user hiện tại (key đầy đủ: [..., userId]).
export const COSMETIC_SHOP_QUERY_KEY = ['cosmeticShop'];

type MutationCallbacks<TData> = Pick<
  UseMutationOptions<TData, ApiError, string>,
  'onSuccess' | 'onError'
>;

export function useBuyCosmetic(
  { onSuccess, onError }: MutationCallbacks<CosmeticResponse> = {},
): UseMutationResult<CosmeticResponse, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<CosmeticResponse, ApiError, string>({
    mutationFn: (cosmeticId: string) => buyCosmetic(cosmeticId),
    onSuccess: async (...args) => {
      qc.invalidateQueries({ queryKey: COINS_QUERY_KEY });
      // Chờ cửa hàng tải lại để nút giữ trạng thái bận tới khi dữ liệu mới về.
      await qc.invalidateQueries({ queryKey: COSMETIC_SHOP_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useEquipCosmetic(
  { onSuccess, onError }: MutationCallbacks<void> = {},
): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (cosmeticId: string) => equipCosmetic(cosmeticId),
    onSuccess: async (...args) => {
      qc.invalidateQueries({ queryKey: EQUIPPED_COSMETICS_QUERY_KEY });
      await qc.invalidateQueries({ queryKey: COSMETIC_SHOP_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useUnequipCosmetic(
  { onSuccess, onError }: MutationCallbacks<void> = {},
): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (cosmeticId: string) => unequipCosmetic(cosmeticId),
    onSuccess: async (...args) => {
      qc.invalidateQueries({ queryKey: EQUIPPED_COSMETICS_QUERY_KEY });
      await qc.invalidateQueries({ queryKey: COSMETIC_SHOP_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}
