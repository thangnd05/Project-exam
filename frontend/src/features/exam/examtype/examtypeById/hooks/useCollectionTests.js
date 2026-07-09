import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '~/shared/config/queryClient';
import { getTestsByCollection, getTestCollectionsByExamType } from '~/shared/api/testApi';

export function useCollectionTests(collectionId, page, size) {
  return useQuery({
    queryKey: ['collection-tests', collectionId, page, size],
    queryFn: () => getTestsByCollection(collectionId, { page, size }),
    enabled: !!collectionId,
    placeholderData: keepPreviousData,
  });
}

export function useCollectionName(examTypeId, collectionId) {
  return useQuery({
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
}
