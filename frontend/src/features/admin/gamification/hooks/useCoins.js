import {
  createCoinWallet,
  deleteCoinWallet,
  getCoinWallets,
  updateCoinBalance,
} from '~/shared/api/coinApi';
import {useAdminCrud} from '~/features/admin/hooks/useAdminCrud';

export const coinKeys = {
  wallets: ['coin-wallets'],
};

export function useCoins() {
  const crud = useAdminCrud({
    queryKey: coinKeys.wallets,
    list: getCoinWallets,
    create: createCoinWallet,
    update: ({userId, balance}) => updateCoinBalance(userId, {balance}),
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
