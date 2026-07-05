/**
 * Dữ liệu cho trang "đề trong 1 bộ đề" — react-query thay useEffect + setLoading.
 * Mẫu phân trang: query phụ thuộc page, keepPreviousData để đổi trang không nháy.
 */
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '~/config/queryClient';
import { getTestsByCollection, getTestCollectionsByExamType } from '~/api/testApi';

export function useCollectionTests(collectionId, page, size) {
  return useQuery({
    queryKey: ['collection-tests', collectionId, page, size],
    queryFn: () => getTestsByCollection(collectionId, { page, size }),
    enabled: !!collectionId,
    placeholderData: keepPreviousData,
  });
}

// Tên folder bộ đề: cache list theo examTypeId, derive tên theo collectionId qua select.
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
