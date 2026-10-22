'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from 'react-bootstrap';
import routes from '@/app/configs/Routes';
import { listPlans } from '@/app/apis/learningPlanApi';
import { LearningPlanStatus } from '@/app/enums';
import { useAuth } from '@/app/hooks/useAuth';
import type { PlanResponse } from '@/app/types';

const createdAtMs = (p: PlanResponse) => (p.createdAt ? new Date(p.createdAt).getTime() : 0);

function LearningPlansRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return undefined;
    const qs = searchParams.toString();
    const toGenerate = () => router.replace(`${routes.generatePlan}${qs ? `?${qs}` : ''}`);

    // Khách bắt đầu từ tab Mục tiêu: đặt mục tiêu là bước đầu của luồng lộ trình.
    if (!isAuthenticated) {
      router.replace(`${routes.myTarget}${qs ? `?${qs}` : ''}`);
      return undefined;
    }

    // Có tham số thì giữ hành vi cũ: sang trang sinh lộ trình.
    if (qs) {
      toGenerate();
      return undefined;
    }

    // Menu "Lộ trình": đang học lộ trình nào thì mở thẳng lộ trình mới nhất, chưa có thì sang trang sinh.
    let cancelled = false;
    listPlans()
      .then((plans) => {
        if (cancelled) return;
        const latest = (plans || [])
          .filter((p) => p.status === LearningPlanStatus.ACTIVE && p.learningPlanId)
          .sort((a, b) => createdAtMs(b) - createdAtMs(a))[0];
        if (latest) router.replace(`/learning-plans/${latest.learningPlanId}`);
        else toGenerate();
      })
      .catch(() => {
        if (!cancelled) toGenerate();
      });
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, isAuthenticated, loading]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <Spinner animation="border" variant="primary" />
    </div>
  );
}

export default LearningPlansRedirect;
