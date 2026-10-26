'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
import routes from '@/app/configs/Routes';
import { PLAN_COMPARE_ANCHOR } from '@/app/features/learning-plans/planCompare';

// So sánh lộ trình đã gộp vào trang Tổng quan; giữ URL cũ để link/bookmark cũ vẫn tới đúng chỗ.
function PlanCompareRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(`${routes.targetDashboard}${qs ? `?${qs}` : ''}#${PLAN_COMPARE_ANCHOR}`);
  }, [router, searchParams]);

  return null;
}

export default PlanCompareRedirect;
