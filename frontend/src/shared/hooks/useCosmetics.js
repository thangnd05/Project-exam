import { useContext } from 'react';
import { CosmeticContext } from '~/shared/context/CosmeticContext';

export const useCosmetics = () => {
  const context = useContext(CosmeticContext);
  if (context === null) {
    throw new Error('useCosmetics must be used within a CosmeticProvider');
  }
  return context;
};
