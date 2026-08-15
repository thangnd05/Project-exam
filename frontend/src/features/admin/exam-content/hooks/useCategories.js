'use client';

import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '~/shared/api/postApi';
import { useAdminCrud } from '~/features/admin/hooks/useAdminCrud';

export const categoriesKeys = {
    all: ['admin-categories'],
};

export function useCategories() {
    const crud = useAdminCrud({
        queryKey: categoriesKeys.all,
        list: getCategories,
        create: (payload) => createCategory(payload),
        update: ({ id, payload }) => updateCategory(id, payload),
        remove: (id) => deleteCategory(id),
    });

    return {
        categories: crud.items,
        isLoading: crud.isLoading,
        createCategory: crud.createMutation.mutateAsync,
        updateCategory: crud.updateMutation.mutateAsync,
        deleteCategory: crud.deleteMutation.mutateAsync,
    };
}
