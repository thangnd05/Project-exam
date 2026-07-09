import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createCoinWallet,
  deleteCoinWallet,
  getCoinWallets,
  updateCoinBalance,
} from '~/shared/api/coinApi';

export const coinKeys = {
  wallets: ['coin-wallets'],
};

const normalizeWallets = (data) => (Array.isArray(data) ? data : []);

export function useCoins() {
  const queryClient = useQueryClient();

  const walletsQuery = useQuery({
    queryKey: coinKeys.wallets,
    queryFn: getCoinWallets,
    select: normalizeWallets,
  });

  const invalidateWallets = () =>
    queryClient.invalidateQueries({queryKey: coinKeys.wallets});

  const createMutation = useMutation({
    mutationFn: createCoinWallet,
    onSuccess: invalidateWallets,
  });

  const updateMutation = useMutation({
    mutationFn: ({userId, balance}) => updateCoinBalance(userId, {balance}),
    onSuccess: invalidateWallets,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => deleteCoinWallet(userId),
    onSuccess: invalidateWallets,
  });

  return {
    wallets: walletsQuery.data ?? [],
    isLoading: walletsQuery.isLoading,
    isError: walletsQuery.isError,
    createWallet: createMutation.mutateAsync,
    updateWallet: updateMutation.mutateAsync,
    deleteWallet: deleteMutation.mutateAsync,
  };
}
