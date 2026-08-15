'use client';

import {
  createExamCategory,
  deleteExamCategory,
  getExamCategories,
  updateExamCategory,
} from '@/app/apis/examCategoryApi';
import {useAdminCrud} from '@/app/hooks/useAdminCrud';
import type {ExamCategoryRequest, ExamCategoryResponse} from '@/app/types';

export const examCategoryKeys = {
  list: () => ['exam-categories'],
};

export type ExamCategoryItem = {
  examCategoryId: string;
  code: string;
  name: string;
  description: string;
  guestAllowed: boolean;
  certificateEligible: boolean;
  displayOrder: number;
};

const mapFromApi = (item: ExamCategoryResponse): ExamCategoryItem => ({
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
    create: (payload: ExamCategoryRequest) => createExamCategory(payload),
    update: ({id, payload}: {id: string; payload: ExamCategoryRequest}) => updateExamCategory(id, payload),
    remove: (id: string) => deleteExamCategory(id),
    mapItem: mapFromApi,
  });

  return {
    categories: crud.items as ExamCategoryItem[],
    isLoading: crud.isLoading,
    isError: crud.isError,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}
