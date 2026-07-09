import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '~/shared/api/postApi';

export const categoriesKeys = {
    all: ['admin-categories'],
};

const normalizeCategories = (data) =>
    Array.isArray(data) ? data : data?.content ?? [];

export function useCategories() {
    const qc = useQueryClient();

    const categoriesQuery = useQuery({
        queryKey: categoriesKeys.all,
        queryFn: getCategories,
        select: normalizeCategories,
    });

    const invalidate = () =>
        qc.invalidateQueries({ queryKey: categoriesKeys.all });

    const createMutation = useMutation({
        mutationFn: (payload) => createCategory(payload),
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateCategory(id, payload),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteCategory(id),
        onSuccess: invalidate,
    });

    return {
        categories: categoriesQuery.data ?? [],
        isLoading: categoriesQuery.isLoading,
        createCategory: createMutation.mutateAsync,
        updateCategory: updateMutation.mutateAsync,
        deleteCategory: deleteMutation.mutateAsync,
    };
}
