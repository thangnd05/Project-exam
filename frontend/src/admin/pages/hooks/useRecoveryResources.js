import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {keepPreviousData} from '~/config/queryClient';

import {getExamTypes} from '~/api/examTypeApi';
import {getTagsFlatByExamType} from '~/api/tagApi';
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from '~/api/recoveryResourceApi';

export const recoveryResourceKeys = {
  resources: ['recovery-resources'],
  examTypes: ['recovery-exam-types'],
  tags: (examTypeId) => ['recovery-tags-flat', examTypeId ?? null],
};

const EMPTY = [];
const asArray = (data) => (Array.isArray(data) ? data : EMPTY);
const mapExamTypes = (list) =>
  asArray(list).map((item) => ({id: item.examTypeId, name: item.name}));

// Danh sách tài liệu + các mutation tạo/sửa/xoá (invalidate lại danh sách khi xong).
export function useRecoveryResources() {
  const qc = useQueryClient();

  const resourcesQuery = useQuery({
    queryKey: recoveryResourceKeys.resources,
    queryFn: getAllResources,
    select: asArray,
  });

  const examTypesQuery = useQuery({
    queryKey: recoveryResourceKeys.examTypes,
    queryFn: getExamTypes,
    select: mapExamTypes,
  });

  const invalidateResources = () =>
    qc.invalidateQueries({queryKey: recoveryResourceKeys.resources});

  const createMutation = useMutation({
    mutationFn: ({payload, file}) => createResource(payload, file),
    onSuccess: invalidateResources,
  });

  const updateMutation = useMutation({
    mutationFn: ({id, payload, file}) => updateResource(id, payload, file),
    onSuccess: invalidateResources,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteResource(id),
    onSuccess: invalidateResources,
  });

  return {
    resources: resourcesQuery.data ?? EMPTY,
    isLoading: resourcesQuery.isLoading,
    isError: resourcesQuery.isError,
    examTypes: examTypesQuery.data ?? EMPTY,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}

// Danh sách tag phẳng theo loại kỳ thi; chỉ fetch khi có examTypeId.
export function useTagsByExamType(examTypeId) {
  const query = useQuery({
    queryKey: recoveryResourceKeys.tags(examTypeId),
    queryFn: () => getTagsFlatByExamType(examTypeId),
    enabled: !!examTypeId,
    placeholderData: keepPreviousData,
    select: asArray,
  });

  return query.data ?? EMPTY;
}
