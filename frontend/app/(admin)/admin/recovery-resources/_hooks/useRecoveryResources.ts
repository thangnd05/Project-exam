'use client';

import {useQuery} from '@tanstack/react-query';
import {keepPreviousData} from '@/app/configs/queryClient';
import {useAdminCrud} from '@/app/hooks/useAdminCrud';

import {getExamTypes} from '@/app/apis/examTypeApi';
import {getExamPartsByExamType} from '@/app/apis/examPartApi';
import {getTagsFlatByExamType} from '@/app/apis/tagApi';
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from '@/app/apis/recoveryResourceApi';
import type {
  ExamPartResponse,
  ExamTypeResponse,
  RecoveryResourceRequest,
  RecoveryResourceResponse,
  TagResponse,
} from '@/app/types';

export interface RecoveryExamTypeOption {
  id?: string;
  name?: string;
}

export const recoveryResourceKeys = {
  resources: ['recovery-resources'] as const,
  examTypes: ['recovery-exam-types'] as const,
  tags: (examTypeId?: string) => ['recovery-tags-flat', examTypeId ?? null] as const,
  parts: (examTypeId?: string) => ['recovery-exam-parts', examTypeId ?? null] as const,
};

const EMPTY: never[] = [];
const asArray = <T,>(data: T[] | null | undefined): T[] => (Array.isArray(data) ? data : EMPTY);
const mapExamTypes = (list: ExamTypeResponse[]): RecoveryExamTypeOption[] =>
  asArray(list).map((item) => ({id: item.examTypeId, name: item.name}));

export function useRecoveryResources() {
  const crud = useAdminCrud({
    queryKey: recoveryResourceKeys.resources,
    list: getAllResources,
    select: asArray,
    create: ({payload, file}: {payload: RecoveryResourceRequest; file?: File | null}) =>
      createResource(payload, file),
    update: ({id, payload, file}: {id: string; payload: RecoveryResourceRequest; file?: File | null}) =>
      updateResource(id, payload, file),
    remove: (id: string) => deleteResource(id),
  });

  const examTypesQuery = useQuery({
    queryKey: recoveryResourceKeys.examTypes,
    queryFn: getExamTypes,
    select: mapExamTypes,
  });

  return {
    resources: crud.items as RecoveryResourceResponse[],
    isLoading: crud.isLoading,
    isError: crud.isError,
    examTypes: examTypesQuery.data ?? (EMPTY as RecoveryExamTypeOption[]),
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}

export function usePartsByExamType(examTypeId: string): ExamPartResponse[] {
  const query = useQuery({
    queryKey: recoveryResourceKeys.parts(examTypeId),
    queryFn: () => getExamPartsByExamType(examTypeId),
    enabled: !!examTypeId,
    placeholderData: keepPreviousData,
    select: asArray,
  });

  return query.data ?? EMPTY;
}

export function useTagsByExamType(examTypeId: string): TagResponse[] {
  const query = useQuery({
    queryKey: recoveryResourceKeys.tags(examTypeId),
    queryFn: () => getTagsFlatByExamType(examTypeId),
    enabled: !!examTypeId,
    placeholderData: keepPreviousData,
    select: asArray,
  });

  return query.data ?? EMPTY;
}
