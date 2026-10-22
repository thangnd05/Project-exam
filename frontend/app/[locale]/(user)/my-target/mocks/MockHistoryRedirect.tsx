'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
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
