'use client';

import { useContext } from 'react';
import { CoinContext, type CoinContextValue } from '@/app/contexts/CoinContext';

export const useCoins = (): CoinContextValue => {
  const context = useContext(CoinContext);
  if (context === null) {
    throw new Error('useCoins must be used within a CoinProvider');
  }
  return context;
};
