'use client';

import {useQuery} from '@tanstack/react-query';
import {keepPreviousData} from '@/app/configs/queryClient';
import {useAdminCrud} from '@/app/[locale]/(admin)/_hooks/useAdminCrud';

import {getExamTypes} from '@/app/apis/examTypeApi';
import {getTagsFlatByExamType} from '@/app/apis/tagApi';
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from '@/app/apis/recoveryResourceApi';
import type {
  ExamTypeResponse,
  RecoveryResourceRequest,
  RecoveryResourceResponse,
  TagResponse,
} from '@/app/types';
import {examTypeKeys, tagKeys} from '@/app/configs/queryKeys';
import {toList} from '@/app/utils/toList';

export interface RecoveryExamTypeOption {
  id?: string;
  name?: string;
}

export const recoveryResourceKeys = {
  resources: ['recovery-resources'] as const,
  examTypes: examTypeKeys.all,
  tags: tagKeys.flat,
};

const EMPTY: never[] = [];
const mapExamTypes = (list: ExamTypeResponse[]): RecoveryExamTypeOption[] =>
  toList(list).map((item) => ({id: item.examTypeId, name: item.name}));

export function useRecoveryResources() {
  const crud = useAdminCrud({
    queryKey: recoveryResourceKeys.resources,
    list: getAllResources,
    select: toList,
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

export function useTagsByExamType(examTypeId: string): TagResponse[] {
  const query = useQuery({
    queryKey: recoveryResourceKeys.tags(examTypeId),
    queryFn: () => getTagsFlatByExamType(examTypeId),
    enabled: !!examTypeId,
    placeholderData: keepPreviousData,
    select: toList,
  });

  return query.data ?? EMPTY;
}
