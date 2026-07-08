import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '~/config/queryClient';
import { getMyTests, deleteTest } from '../api/testApi';

export const myTestKeys = {
  all: ['my-tests'],
  list: (page, size) => ['my-tests', { page, size }],
};

export function useMyTests({ page = 0, size = 12 } = {}) {
  return useQuery({
    queryKey: myTestKeys.list(page, size),
    queryFn: () => getMyTests({ page, size }),
    placeholderData: keepPreviousData,
  });
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
