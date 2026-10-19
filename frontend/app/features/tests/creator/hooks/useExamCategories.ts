'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExamCategories } from '@/app/apis/examCategoryApi';
import { useAuth } from '@/app/hooks/useAuth';
import { PermissionCode } from '@/app/enums';
import { examCategoryKeys } from '@/app/configs/queryKeys';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import type { ExamCategoryResponse } from '@/app/types';

export function useExamCategories() {
  const { permissions } = useAuth();
  const { data: examCategories = EMPTY_LIST as ExamCategoryResponse[] } = useQuery({
    queryKey: examCategoryKeys.all,
    queryFn: getExamCategories,
    select: (list): ExamCategoryResponse[] => (Array.isArray(list) ? list : []),
  });

  const canPickCertificateCategory =
    Array.isArray(permissions) && permissions.includes(PermissionCode.TEST_MANAGE);

  return useMemo(
    () =>
      examCategories.filter(
        (category) => canPickCertificateCategory || !category.certificateEligible,
      ),
    [examCategories, canPickCertificateCategory],
  );
}
