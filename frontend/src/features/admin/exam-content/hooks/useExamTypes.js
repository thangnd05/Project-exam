import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createExamType,
  deleteExamType,
  getExamTypes,
  updateExamType,
  updateExamTypeLayout,
} from '~/shared/api/examTypeApi';

export const examTypeKeys = {
  all: ['exam-types'],
  layout: (examTypeId) => ['exam-type-layout', examTypeId ?? null],
};

const normalizeList = (data) =>
  Array.isArray(data) ? data : data?.content ?? [];

export function useExamTypes() {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: examTypeKeys.all,
    queryFn: getExamTypes,
    select: normalizeList,
  });

  const invalidate = () => qc.invalidateQueries({queryKey: examTypeKeys.all});

  const createMutation = useMutation({
    mutationFn: createExamType,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({id, payload}) => updateExamType(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExamType,
    onSuccess: invalidate,
  });

  return {
    examTypeList: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    createMutation,
    updateMutation,
    deleteMutation,
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
