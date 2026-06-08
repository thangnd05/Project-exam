import { createContext, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '~/config/queryClient';
import { getMyCoins } from '~/api/coinApi';
import { useAuth } from '~/hooks/useAuth';

export const CoinContext = createContext(null);

export const COINS_QUERY_KEY = ['myCoins'];

export const CoinProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: COINS_QUERY_KEY,
    queryFn: getMyCoins,
    enabled: isAuthenticated,
    // Số dư xu có thể thay đổi -> luôn coi là cũ và làm mới khi quay lại tab.
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const balance = isAuthenticated ? data?.balance ?? 0 : 0;

  // Gọi sau khi user kiếm/tiêu xu để cập nhật ngay số dư hiển thị.
  const refreshCoins = useCallback(
    () => queryClient.invalidateQueries({ queryKey: COINS_QUERY_KEY }),
    []
  );

  const value = useMemo(
    () => ({ balance, refreshCoins }),
    [balance, refreshCoins]
  );

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
};
