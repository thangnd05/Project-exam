'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buyCosmetic, equipCosmetic, unequipCosmetic } from '@/app/apis/cosmeticApi';
import { COINS_QUERY_KEY } from '@/app/contexts/CoinContext';
import { EQUIPPED_COSMETICS_QUERY_KEY } from '@/app/contexts/CosmeticContext';

export function useBuyCosmetic({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cosmeticId) => buyCosmetic(cosmeticId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: COINS_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useEquipCosmetic({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cosmeticId) => equipCosmetic(cosmeticId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: EQUIPPED_COSMETICS_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useUnequipCosmetic({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cosmeticId) => unequipCosmetic(cosmeticId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: EQUIPPED_COSMETICS_QUERY_KEY });
      onSuccess?.(...args);
    },
    onError,
  });
}
