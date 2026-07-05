import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {createQuest, deleteQuest, getQuests, updateQuest} from '~/api/questApi';

export const questKeys = {all: ['admin-quests']};

const normalizeQuests = (data) => (Array.isArray(data) ? data : []);

export function useQuests() {
  const qc = useQueryClient();

  const questsQuery = useQuery({
    queryKey: questKeys.all,
    queryFn: getQuests,
    select: normalizeQuests,
  });

  const invalidate = () => qc.invalidateQueries({queryKey: questKeys.all});

  const createMutation = useMutation({mutationFn: createQuest, onSuccess: invalidate});
  const updateMutation = useMutation({
    mutationFn: ({id, payload}) => updateQuest(id, payload),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({mutationFn: deleteQuest, onSuccess: invalidate});

  return {
    quests: questsQuery.data ?? [],
    isLoading: questsQuery.isLoading,
    isError: questsQuery.isError,
    createQuest: createMutation.mutateAsync,
    updateQuest: updateMutation.mutateAsync,
    removeQuest: deleteMutation.mutateAsync,
  };
}
