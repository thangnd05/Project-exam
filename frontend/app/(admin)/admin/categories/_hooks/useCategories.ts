'use client';

import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '@/app/apis/postApi';
import { useAdminCrud } from '@/app/hooks/useAdminCrud';
import type { CategoryRequest, CategoryResponse } from '@/app/types';

export const categoriesKeys = {
    all: ['admin-categories'],
};

export interface AdminCategory extends CategoryResponse {
    name: string;
}

export function useCategories() {
    const crud = useAdminCrud({
        queryKey: categoriesKeys.all,
        list: getCategories,
        create: (payload: CategoryRequest) => createCategory(payload),
        update: ({ id, payload }: { id: string; payload: CategoryRequest }) => updateCategory(id, payload),
        remove: (id: string) => deleteCategory(id),
    });

    return {
        categories: crud.items as AdminCategory[],
        isLoading: crud.isLoading,
        createCategory: crud.createMutation.mutateAsync,
        updateCategory: crud.updateMutation.mutateAsync,
        deleteCategory: crud.deleteMutation.mutateAsync,
    };
}
