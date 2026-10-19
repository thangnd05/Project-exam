'use client';

import { useEffect, useMemo, useState } from 'react';
import { getExamCategories } from '@/app/apis/examCategoryApi';
import { useAuth } from '@/app/hooks/useAuth';
import { PermissionCode } from '@/app/enums';
import type { ExamCategoryResponse } from '@/app/types';

export function useExamCategories() {
  const { permissions } = useAuth();
  const [examCategories, setExamCategories] = useState<ExamCategoryResponse[]>([]);

  useEffect(() => {
    getExamCategories()
      .then((list) => setExamCategories(Array.isArray(list) ? list : []))
      .catch(() => setExamCategories([]));
  }, []);

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
