'use client';

import { useAuth } from './useAuth';

export const usePermission = (): ((code: string) => boolean) => {
  const { permissions } = useAuth();
  return (code: string) => Array.isArray(permissions) && permissions.includes(code);
};

export const useHasPermission = (code: string): boolean => {
  const { permissions } = useAuth();
  return Array.isArray(permissions) && permissions.includes(code);
};
