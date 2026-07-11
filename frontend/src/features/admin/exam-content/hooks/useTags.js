import {useMutation, useQueryClient} from '@tanstack/react-query';

import {createTag, deleteTag, updateTag} from '~/shared/api/tagApi';

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
