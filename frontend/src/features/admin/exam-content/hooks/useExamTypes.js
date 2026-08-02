import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createExamType,
  deleteExamType,
  getExamTypeById,
  getExamTypes,
  getOwnExamTypeLayout,
  updateExamType,
  updateExamTypeLayout,
} from '~/shared/api/examTypeApi';
import {useAdminCrud} from '~/features/admin/hooks/useAdminCrud';

export const examTypeKeys = {
  all: ['exam-types'],
  detail: (examTypeId) => ['exam-type', examTypeId ?? null],
  layout: (examTypeId) => ['exam-type-layout', examTypeId ?? null],
};

export function useExamTypes() {
  const crud = useAdminCrud({
    queryKey: examTypeKeys.all,
    list: getExamTypes,
    create: createExamType,
    update: ({id, payload}) => updateExamType(id, payload),
    remove: deleteExamType,
  });

  return {
    examTypeList: crud.items,
    isLoading: crud.isLoading,
    isError: crud.isError,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}

export function useExamTypeById(examTypeId) {
  const query = useQuery({
    queryKey: examTypeKeys.detail(examTypeId),
    queryFn: () => getExamTypeById(examTypeId),
    enabled: !!examTypeId,
  });

  return {
    examType: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useOwnExamTypeLayout(examTypeId) {
  const query = useQuery({
    queryKey: examTypeKeys.layout(examTypeId),
    queryFn: () => getOwnExamTypeLayout(examTypeId),
    enabled: !!examTypeId,
  });

  return {
    layout: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useUpdateExamTypeLayout({onSuccess, onError} = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({examTypeId, config}) => updateExamTypeLayout(examTypeId, config),
    onSuccess: (data, variables, ...rest) => {
      qc.invalidateQueries({queryKey: examTypeKeys.layout(variables.examTypeId)});
      onSuccess?.(data, variables, ...rest);
    },
    onError,
  });
}
