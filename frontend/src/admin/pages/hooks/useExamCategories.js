import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createExamCategory,
  deleteExamCategory,
  getExamCategories,
  updateExamCategory,
} from '~/shared/api/examCategoryApi';

export const examCategoryKeys = {
  list: () => ['exam-categories'],
};

const mapFromApi = (item) => ({
  examCategoryId: String(item.examCategoryId),
  code: item.code || '',
  name: item.name || '',
  description: item.description || '',
  guestAllowed: !!item.guestAllowed,
  displayOrder: item.displayOrder ?? 0,
});

const normalizeList = (data) => {
  const list = Array.isArray(data) ? data : data?.content ?? [];
  return list.map(mapFromApi);
};

export function useExamCategories() {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: examCategoryKeys.list(),
    queryFn: getExamCategories,
    select: normalizeList,
  });

  const invalidateList = () =>
    qc.invalidateQueries({queryKey: examCategoryKeys.list()});

  const createMutation = useMutation({
    mutationFn: createExamCategory,
    onSuccess: invalidateList,
  });

  const updateMutation = useMutation({
    mutationFn: ({id, payload}) => updateExamCategory(id, payload),
    onSuccess: invalidateList,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExamCategory,
    onSuccess: invalidateList,
  });

  return {
    categories: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
