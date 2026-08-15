'use client';

// Chuyển hướng giữ nguyên query string. Bản react-router cũ dùng <Navigate replace/> ngay khi
// render; Next không cho điều hướng lúc render nên phải đẩy vào useEffect.

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import routes from '@/app/configs/Routes';

function MockHistoryRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(`${routes.targetDashboard}${qs ? `?${qs}` : ''}`);
  }, [router, searchParams]);

  return null;
}

export default MockHistoryRedirect;
