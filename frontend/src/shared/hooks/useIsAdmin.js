import { useAuth } from './useAuth';

export const useIsAdmin = () => {
  const { roleName } = useAuth();
  return roleName === 'ADMIN';
};
