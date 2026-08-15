'use client';

import { useContext } from 'react';
import { CoinContext } from '~/shared/context/CoinContext';

export const useCoins = () => {
  const context = useContext(CoinContext);
  if (context === null) {
    throw new Error('useCoins must be used within a CoinProvider');
  }
  return context;
};
