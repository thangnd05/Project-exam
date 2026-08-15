'use client';

import {
  createCosmetic,
  deleteCosmetic,
  getCosmetics,
  updateCosmetic,
} from '@/app/apis/cosmeticApi';
import {useAdminCrud} from '@/app/hooks/useAdminCrud';
import type {CosmeticRequest, CosmeticResponse} from '@/app/types';

export const cosmeticKeys = {
  list: () => ['admin-cosmetics'] as const,
};

export function useAdminCosmetics() {
  const crud = useAdminCrud({
    queryKey: cosmeticKeys.list(),
    list: getCosmetics,
    create: createCosmetic,
    update: ({id, payload}: {id: string; payload: CosmeticRequest}) => updateCosmetic(id, payload),
    remove: deleteCosmetic,
  });

  return {
    items: crud.items as CosmeticResponse[],
    isLoading: crud.isLoading,
    isError: crud.isError,
    createCosmetic: crud.createMutation.mutateAsync,
    updateCosmetic: crud.updateMutation.mutateAsync,
    deleteCosmetic: crud.deleteMutation.mutateAsync,
    isSubmitting: crud.createMutation.isPending || crud.updateMutation.isPending,
    isDeleting: crud.deleteMutation.isPending,
  };
}
