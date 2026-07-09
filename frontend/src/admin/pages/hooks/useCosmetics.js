import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createCosmetic,
  deleteCosmetic,
  getCosmetics,
  updateCosmetic,
} from '~/shared/api/cosmeticApi';

export const cosmeticKeys = {
  list: () => ['admin-cosmetics'],
};

const normalizeList = (data) => (Array.isArray(data) ? data : []);

export function useCosmetics() {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: cosmeticKeys.list(),
    queryFn: getCosmetics,
    select: normalizeList,
  });

  const invalidate = () => qc.invalidateQueries({queryKey: cosmeticKeys.list()});

  const createMutation = useMutation({
    mutationFn: createCosmetic,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({id, payload}) => updateCosmetic(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCosmetic,
    onSuccess: invalidate,
  });

  return {
    items: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    createCosmetic: createMutation.mutateAsync,
    updateCosmetic: updateMutation.mutateAsync,
    deleteCosmetic: deleteMutation.mutateAsync,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
