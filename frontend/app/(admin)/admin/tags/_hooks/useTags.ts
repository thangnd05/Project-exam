'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {getExamTypes} from '@/app/apis/examTypeApi';
import {createTag, deleteTag, getTagTreeByExamType, getTagsFlatByExamType, updateTag} from '@/app/apis/tagApi';
import {examTypeKeys} from '@/app/hooks/useExamTypes';
import type {TagRequest, TagResponse} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const tagKeys = {
  all: ['admin-tags'],
  byExamType: (examTypeId?: string | null) => ['admin-tags', examTypeId ?? null],
};

export interface AdminTag extends TagResponse {
  name: string;
  children?: AdminTag[];
}

export type TagExamTypeOption = {id: string; name?: string};

export function useTags() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({queryKey: tagKeys.all});

  const createMutation = useMutation({
    mutationFn: (payload: TagRequest) => createTag(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({tagId, payload}: {tagId: string; payload: TagRequest}) => updateTag(tagId, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: invalidate,
  });

  return {createMutation, updateMutation, deleteMutation};
}

export function useAdminExamTypesForTags() {
  const query = useQuery({
    queryKey: examTypeKeys.all,
    queryFn: getExamTypes,
    select: (list): TagExamTypeOption[] => list.map((item) => ({ id: item.examTypeId, name: item.name })),
  });

  return {
    examTypes: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useTagTree(examTypeId?: string) {
  const treeQuery = useQuery({
    queryKey: [...tagKeys.byExamType(examTypeId), 'tree'],
    queryFn: () => getTagTreeByExamType(examTypeId as string),
    enabled: !!examTypeId,
  });
  const flatQuery = useQuery({
    queryKey: [...tagKeys.byExamType(examTypeId), 'flat'],
    queryFn: () => getTagsFlatByExamType(examTypeId as string),
    enabled: !!examTypeId,
  });

  const refetch = () => Promise.all([treeQuery.refetch(), flatQuery.refetch()]);

  return {
    tagTree: (treeQuery.data ?? []) as AdminTag[],
    flatTags: (flatQuery.data ?? []) as AdminTag[],
    isLoading: treeQuery.isLoading || flatQuery.isLoading,
    isError: treeQuery.isError || flatQuery.isError,
    refetch,
  };
}
