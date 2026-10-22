'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserTestInfo } from '@/app/apis/testApi';

// Cùng khoá với useTestHistory nên trang lịch sử và đầu trang dùng chung một lần tải thông tin đề.
export const testInfoKey = (testId?: string) => ['test-info', testId];

export function useTestInfo(testId?: string) {
  const query = useQuery({
    queryKey: testInfoKey(testId),
    queryFn: () => getUserTestInfo(testId as string),
    enabled: !!testId,
  });

  return { test: query.data ?? null, isLoading: query.isLoading };
}
