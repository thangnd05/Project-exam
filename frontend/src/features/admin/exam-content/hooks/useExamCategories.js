import {
  createExamCategory,
  deleteExamCategory,
  getExamCategories,
  updateExamCategory,
} from '~/shared/api/examCategoryApi';
import {useAdminCrud} from '~/features/admin/hooks/useAdminCrud';

export const examCategoryKeys = {
  list: () => ['exam-categories'],
};

const mapFromApi = (item) => ({
  examCategoryId: String(item.examCategoryId),
  code: item.code || '',
  name: item.name || '',
  description: item.description || '',
  guestAllowed: !!item.guestAllowed,
  certificateEligible: !!item.certificateEligible,
  displayOrder: item.displayOrder ?? 0,
});

export function useExamCategories() {
  const crud = useAdminCrud({
    queryKey: examCategoryKeys.list(),
    list: getExamCategories,
    create: createExamCategory,
    update: ({id, payload}) => updateExamCategory(id, payload),
    remove: deleteExamCategory,
    mapItem: mapFromApi,
  });

  return {
    categories: crud.items,
    isLoading: crud.isLoading,
    isError: crud.isError,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}
