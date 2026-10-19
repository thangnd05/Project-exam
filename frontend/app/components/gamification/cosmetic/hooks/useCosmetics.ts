'use client';

import { useContext } from 'react';
import { CosmeticContext, type CosmeticContextValue } from '@/app/contexts/CosmeticContext';

export const useCosmetics = (): CosmeticContextValue => {
  const context = useContext(CosmeticContext);
  if (context === null) {
    throw new Error('useCosmetics must be used within a CosmeticProvider');
  }
  return context;
};
