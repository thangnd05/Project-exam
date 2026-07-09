import { useAuth } from './useAuth';

export const usePermission = () => {
  const { permissions } = useAuth();
  return (code) => Array.isArray(permissions) && permissions.includes(code);
};

export const useHasPermission = (code) => {
  const { permissions } = useAuth();
  return Array.isArray(permissions) && permissions.includes(code);
};
