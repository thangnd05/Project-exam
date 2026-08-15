'use client';

// Xem ghi chú ở MockHistoryRedirect: <Navigate> của react-router không có bản tương đương
// dùng lúc render trong Next, phải chuyển hướng trong useEffect.

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import routes from '~/shared/config/Routes';

function LearningPlansRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(`${routes.generatePlan}${qs ? `?${qs}` : ''}`);
  }, [router, searchParams]);

  return null;
}

export default LearningPlansRedirect;
