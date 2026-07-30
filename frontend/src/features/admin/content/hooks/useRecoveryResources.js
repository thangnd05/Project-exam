import {useQuery} from '@tanstack/react-query';
import {keepPreviousData} from '~/shared/config/queryClient';
import {useAdminCrud} from '~/features/admin/hooks/useAdminCrud';

import {getExamTypes} from '~/shared/api/examTypeApi';
import {getExamPartsByExamType} from '~/shared/api/examPartApi';
import {getTagsFlatByExamType} from '~/shared/api/tagApi';
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from '~/shared/api/recoveryResourceApi';

export const recoveryResourceKeys = {
  resources: ['recovery-resources'],
  examTypes: ['recovery-exam-types'],
  tags: (examTypeId) => ['recovery-tags-flat', examTypeId ?? null],
  parts: (examTypeId) => ['recovery-exam-parts', examTypeId ?? null],
};

const EMPTY = [];
const asArray = (data) => (Array.isArray(data) ? data : EMPTY);
const mapExamTypes = (list) =>
  asArray(list).map((item) => ({id: item.examTypeId, name: item.name}));

export function useRecoveryResources() {
  const crud = useAdminCrud({
    queryKey: recoveryResourceKeys.resources,
    list: getAllResources,
    select: asArray,
    create: ({payload, file}) => createResource(payload, file),
    update: ({id, payload, file}) => updateResource(id, payload, file),
    remove: (id) => deleteResource(id),
  });

  const examTypesQuery = useQuery({
    queryKey: recoveryResourceKeys.examTypes,
    queryFn: getExamTypes,
    select: mapExamTypes,
  });

  return {
    resources: crud.items,
    isLoading: crud.isLoading,
    isError: crud.isError,
    examTypes: examTypesQuery.data ?? EMPTY,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}

export function usePartsByExamType(examTypeId) {
  const query = useQuery({
    queryKey: recoveryResourceKeys.parts(examTypeId),
    queryFn: () => getExamPartsByExamType(examTypeId),
    enabled: !!examTypeId,
    placeholderData: keepPreviousData,
    select: asArray,
  });

  return query.data ?? EMPTY;
}

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
