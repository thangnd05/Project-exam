import { createContext, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '~/config/queryClient';
import { getMyEquippedCosmetics } from '~/api/cosmeticApi';
import { useAuth } from '~/hooks/useAuth';

export const CosmeticContext = createContext(null);

export const EQUIPPED_COSMETICS_QUERY_KEY = ['myEquippedCosmetics'];

export const CosmeticProvider = ({ children }) => {
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
