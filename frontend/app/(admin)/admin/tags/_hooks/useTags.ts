'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {getExamTypes} from '@/app/apis/examTypeApi';
import {getExamPartsByExamType} from '@/app/apis/examPartApi';
import {createTag, deleteTag, getTagsFlatByExamType, updateTag} from '@/app/apis/tagApi';
import {examTypeKeys} from '@/app/hooks/useExamTypes';
import type {ExamPartResponse, TagRequest, TagResponse} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const tagKeys = {
  all: ['admin-tags'],
  byExamType: (examTypeId?: string | null) => ['admin-tags', examTypeId ?? null],
};

export interface AdminTag extends TagResponse {
  name: string;
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

export function useTagList(examTypeId?: string) {
  const query = useQuery({
    queryKey: [...tagKeys.byExamType(examTypeId), 'flat'],
    queryFn: () => getTagsFlatByExamType(examTypeId as string),
    enabled: !!examTypeId,
  });

  return {
    tags: (query.data ?? EMPTY_LIST) as AdminTag[],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useExamPartsForTags(examTypeId?: string) {
  const query = useQuery({
    queryKey: ['admin-tags-exam-parts', examTypeId ?? null],
    queryFn: () => getExamPartsByExamType(examTypeId as string),
    enabled: !!examTypeId,
    select: (list): ExamPartResponse[] =>
      [...list].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)),
  });
  return {examParts: query.data ?? EMPTY_LIST};
}
