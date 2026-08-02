import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {getExamTypes} from '~/shared/api/examTypeApi';
import {createTag, deleteTag, getTagTreeByExamType, getTagsFlatByExamType, updateTag} from '~/shared/api/tagApi';
import {examTypeKeys} from '~/features/admin/exam-content/hooks/useExamTypes';

export const tagKeys = {
  all: ['admin-tags'],
  byExamType: (examTypeId) => ['admin-tags', examTypeId ?? null],
};

export function useTags() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({queryKey: tagKeys.all});

  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({tagId, payload}) => updateTag(tagId, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: invalidate,
  });

  return {createMutation, updateMutation, deleteMutation};
}

export function useAdminExamTypesForTags() {
  const query = useQuery({
    queryKey: examTypeKeys.all,
    queryFn: getExamTypes,
    select: (list) => list.map((item) => ({ id: item.examTypeId, name: item.name })),
  });

  return {
    examTypes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useTagTree(examTypeId) {
  const treeQuery = useQuery({
    queryKey: [...tagKeys.byExamType(examTypeId), 'tree'],
    queryFn: () => getTagTreeByExamType(examTypeId),
    enabled: !!examTypeId,
  });
  const flatQuery = useQuery({
    queryKey: [...tagKeys.byExamType(examTypeId), 'flat'],
    queryFn: () => getTagsFlatByExamType(examTypeId),
    enabled: !!examTypeId,
  });

  const refetch = () => Promise.all([treeQuery.refetch(), flatQuery.refetch()]);

  return {
    tagTree: treeQuery.data ?? [],
    flatTags: flatQuery.data ?? [],
    isLoading: treeQuery.isLoading || flatQuery.isLoading,
    isError: treeQuery.isError || flatQuery.isError,
    refetch,
  };
}
