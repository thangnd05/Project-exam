'use client';

import {
  createCosmetic,
  deleteCosmetic,
  getCosmetics,
  updateCosmetic,
} from '~/shared/api/cosmeticApi';
import {useAdminCrud} from '~/features/admin/hooks/useAdminCrud';

export const cosmeticKeys = {
  list: () => ['admin-cosmetics'],
};

export function useAdminCosmetics() {
  const crud = useAdminCrud({
    queryKey: cosmeticKeys.list(),
    list: getCosmetics,
    create: createCosmetic,
    update: ({id, payload}) => updateCosmetic(id, payload),
    remove: deleteCosmetic,
  });

  return {
    items: crud.items,
    isLoading: crud.isLoading,
    isError: crud.isError,
    createCosmetic: crud.createMutation.mutateAsync,
    updateCosmetic: crud.updateMutation.mutateAsync,
    deleteCosmetic: crud.deleteMutation.mutateAsync,
    isSubmitting: crud.createMutation.isPending || crud.updateMutation.isPending,
    isDeleting: crud.deleteMutation.isPending,
  };
}
