'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import { getMyTests, deleteTest } from '@/app/apis/testApi';

export const myTestKeys = {
  all: ['my-tests'],
  list: (page, size) => ['my-tests', { page, size }],
};

export function useMyTests({ page = 0, size = 12 } = {}) {
  const query = useQuery({
    queryKey: myTestKeys.list(page, size),
    queryFn: () => getMyTests({ page, size }),
    placeholderData: keepPreviousData,
  });

  return {
    tests: Array.isArray(query.data?.content) ? query.data.content : [],
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading || query.isPending,
    isError: query.isError,
  };
}

export function useDeleteTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId) => deleteTest(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myTestKeys.all });
    },
  });
}

export function useInvalidateMyTests() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: myTestKeys.all });
}
