'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import { getTestsByCollection, getTestCollectionsByExamType } from '@/app/apis/testApi';

export function useCollectionTests(collectionId, page, size) {
  const query = useQuery({
    queryKey: ['collection-tests', collectionId, page, size],
    queryFn: () => getTestsByCollection(collectionId, { page, size }),
    enabled: !!collectionId,
    placeholderData: keepPreviousData,
  });

  return {
    tests: Array.isArray(query.data?.content) ? query.data.content : [],
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useCollectionName(examTypeId, collectionId) {
  const query = useQuery({
    queryKey: ['exam-collections', examTypeId],
    queryFn: () => getTestCollectionsByExamType(examTypeId),
    enabled: !!examTypeId,
    select: (data) => {
      const found = (Array.isArray(data) ? data : []).find(
        (f) => String(f.collectionId) === String(collectionId),
      );
      return found?.name || '';
    },
  });

  return {
    collectionName: query.data ?? '',
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
