'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createExamType,
  deleteExamType,
  getExamTypeById,
  getExamTypes,
  getOwnExamTypeLayout,
  updateExamType,
  updateExamTypeLayout,
} from '@/app/apis/examTypeApi';
import {useAdminCrud} from '@/app/hooks/useAdminCrud';
import {examTypeKeys} from '@/app/hooks/examTypeKeys';
import type {ExamTypeLayoutResponse, ExamTypeRequest, ExamTypeResponse} from '@/app/types';

export {examTypeKeys};

export function useExamTypes() {
  const crud = useAdminCrud({
    queryKey: examTypeKeys.all,
    list: getExamTypes,
    create: (payload: ExamTypeRequest) => createExamType(payload),
    update: ({id, payload}: {id: string; payload: ExamTypeRequest}) => updateExamType(id, payload),
    remove: (id: string) => deleteExamType(id),
  });

  return {
    examTypeList: crud.items as ExamTypeResponse[],
    isLoading: crud.isLoading,
    isError: crud.isError,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}

export function useExamTypeById(examTypeId?: string) {
  const query = useQuery({
    queryKey: examTypeKeys.detail(examTypeId),
    queryFn: () => getExamTypeById(examTypeId as string),
    enabled: !!examTypeId,
  });

  return {
    examType: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useOwnExamTypeLayout(examTypeId?: string) {
  const query = useQuery({
    queryKey: examTypeKeys.layout(examTypeId),
    queryFn: () => getOwnExamTypeLayout(examTypeId as string),
    enabled: !!examTypeId,
  });

  return {
    layout: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

type UpdateLayoutVariables = {examTypeId: string; config?: string};

type UpdateLayoutCallbacks = {
  onSuccess?: (data: ExamTypeLayoutResponse, variables: UpdateLayoutVariables, context: unknown) => void;
  onError?: (error: unknown) => void;
};

export function useUpdateExamTypeLayout({onSuccess, onError}: UpdateLayoutCallbacks = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({examTypeId, config}: UpdateLayoutVariables) => updateExamTypeLayout(examTypeId, config),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({queryKey: examTypeKeys.layout(variables.examTypeId)});
      onSuccess?.(data, variables, context);
    },
    onError,
  });
}
