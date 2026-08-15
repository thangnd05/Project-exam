'use client';

import { createContext, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/app/configs/queryClient';
import { getMyEquippedCosmetics } from '@/app/apis/cosmeticApi';
import { useAuth } from '@/app/hooks/useAuth';

export type EquippedCosmetic = Record<string, any>;

export type CosmeticContextValue = {
  frame: EquippedCosmetic | null;
  badge: EquippedCosmetic | null;
  refreshCosmetics: () => Promise<void>;
};

export const CosmeticContext = createContext<CosmeticContextValue | null>(null);

export const EQUIPPED_COSMETICS_QUERY_KEY = ['myEquippedCosmetics'];

export const CosmeticProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: EQUIPPED_COSMETICS_QUERY_KEY,
    queryFn: getMyEquippedCosmetics,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const frame = isAuthenticated ? data?.frame ?? null : null;
  const badge = isAuthenticated ? data?.badge ?? null : null;

  const refreshCosmetics = useCallback(
    () => queryClient.invalidateQueries({ queryKey: EQUIPPED_COSMETICS_QUERY_KEY }),
    []
  );

  const value = useMemo(
    () => ({ frame, badge, refreshCosmetics }),
    [frame, badge, refreshCosmetics]
  );

  return <CosmeticContext.Provider value={value}>{children}</CosmeticContext.Provider>;
};
