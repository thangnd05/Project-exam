'use client';

import { useQuery } from '@tanstack/react-query';
import {
  createCoinWallet,
  deleteCoinWallet,
  getCoinWallets,
  updateCoinBalance,
} from '~/shared/api/coinApi';
import { getUsers } from '~/shared/api/userApi';
import { useAdminCrud } from '~/features/admin/hooks/useAdminCrud';

export const coinKeys = {
  wallets: ['coin-wallets'],
  userOptions: ['coin-user-options'],
};

export function useAdminCoins() {
  const crud = useAdminCrud({
    queryKey: coinKeys.wallets,
    list: getCoinWallets,
    create: createCoinWallet,
    update: ({ userId, balance }) => updateCoinBalance(userId, { balance }),
    remove: (userId) => deleteCoinWallet(userId),
  });

  return {
    wallets: crud.items,
    isLoading: crud.isLoading,
    isError: crud.isError,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}

export function useCoinUserOptions({ enabled = false, wallets = [] } = {}) {
  const query = useQuery({
    queryKey: coinKeys.userOptions,
    queryFn: () => getUsers({ page: 0, size: 100 }),
    enabled,
    select: (response) => {
      const existingUserIds = new Set(wallets.map((wallet) => wallet.userId));
      return (response?.content || []).filter((user) => !existingUserIds.has(user.id));
    },
  });

  return {
    userOptions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
