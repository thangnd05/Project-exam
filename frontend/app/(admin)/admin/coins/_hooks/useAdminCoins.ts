'use client';

import { useQuery } from '@tanstack/react-query';
import {
  createCoinWallet,
  deleteCoinWallet,
  getCoinWallets,
  updateCoinBalance,
} from '@/app/apis/coinApi';
import { getUsers } from '@/app/apis/userApi';
import { useAdminCrud } from '@/app/hooks/useAdminCrud';
import type { CoinWalletResponse, PageResponse, UserResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const coinKeys = {
  wallets: ['coin-wallets'] as const,
  userOptions: ['coin-user-options'] as const,
};

export function useAdminCoins() {
  const crud = useAdminCrud({
    queryKey: coinKeys.wallets,
    list: getCoinWallets,
    create: createCoinWallet,
    update: ({ userId, balance }: { userId: string; balance: number }) =>
      updateCoinBalance(userId, { balance }),
    remove: (userId: string) => deleteCoinWallet(userId),
  });

  return {
    wallets: crud.items as CoinWalletResponse[],
    isLoading: crud.isLoading,
    isError: crud.isError,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}

interface CoinUserOptionsParams {
  enabled?: boolean;
  wallets?: CoinWalletResponse[];
}

export function useCoinUserOptions({ enabled = false, wallets = [] }: CoinUserOptionsParams = {}) {
  const query = useQuery({
    queryKey: coinKeys.userOptions,
    queryFn: () => getUsers({ page: 0, size: 100 }),
    enabled,
    select: (response: PageResponse<UserResponse>) => {
      const existingUserIds = new Set(wallets.map((wallet) => wallet.userId));
      return (response?.content || []).filter((user) => !existingUserIds.has(user.id));
    },
  });

  return {
    userOptions: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
