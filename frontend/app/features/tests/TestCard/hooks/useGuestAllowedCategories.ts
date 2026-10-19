'use client';

import { useQuery } from '@tanstack/react-query';
import { getExamCategories } from '@/app/apis/examCategoryApi';
import type { TestResponse } from '@/app/types';
import {examCategoryKeys} from '@/app/configs/queryKeys';

// Danh sách loại đề cho phép khách làm, dùng chung cho mọi thẻ đề nên chỉ gọi API một lần.
export function useGuestAllowedCategories(enabled = true) {
  const { data, isSuccess } = useQuery({
    queryKey: examCategoryKeys.all,
    queryFn: getExamCategories,
    enabled,
    staleTime: 10 * 60 * 1000,
    select: (list) =>
      new Set(
        (Array.isArray(list) ? list : [])
          .filter((c) => c.guestAllowed)
          .map((c) => c.examCategoryId),
      ),
  });

  // Khớp điều kiện ở backend: đề không thuộc lớp và thuộc loại đề cho phép khách.
  const isGuestAllowed = (test: TestResponse): boolean | null => {
    if (!isSuccess || !data) return null;
    return !test.classId && Boolean(test.examCategoryId) && data.has(test.examCategoryId!);
  };

  return { isGuestAllowed };
}
