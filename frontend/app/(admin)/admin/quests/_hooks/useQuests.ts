'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {createQuest, deleteQuest, getQuests, updateQuest} from '@/app/apis/questApi';
import type {QuestRequest, QuestResponse} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const questKeys = {all: ['admin-quests'] as const};

const normalizeQuests = (data: QuestResponse[]): QuestResponse[] => (Array.isArray(data) ? data : []);

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
    mutationFn: ({id, payload}: {id: string; payload: QuestRequest}) => updateQuest(id, payload),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({mutationFn: deleteQuest, onSuccess: invalidate});

  return {
    quests: questsQuery.data ?? EMPTY_LIST,
    isLoading: questsQuery.isLoading,
    isError: questsQuery.isError,
    createQuest: createMutation.mutateAsync,
    updateQuest: updateMutation.mutateAsync,
    removeQuest: deleteMutation.mutateAsync,
  };
}
