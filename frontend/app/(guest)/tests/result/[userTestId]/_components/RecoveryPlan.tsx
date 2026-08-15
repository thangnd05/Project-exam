'use client';

import { useRouter } from 'next/navigation';
import { IoCalendarOutline} from 'react-icons/io5';
import classNames from 'classnames/bind';
import routes from '@/app/configs/Routes';
import { buildRecoveryMessage } from '@/app/utils/readiness-label';
import styles from './Result.module.scss';

const cx = classNames.bind(styles);

type RecoveryPlanProps = {
  userTestId?: string;
  examTypeId?: string;
  hasTarget?: boolean;
  isTargetMet?: boolean | null;
  readinessScore?: number | null;
  readinessLevel?: string | null;
  isGuest?: boolean;
};

function RecoveryPlan({
  userTestId,
  examTypeId,
  hasTarget,
  isTargetMet,
  readinessScore,
  readinessLevel,
  isGuest,
}: RecoveryPlanProps) {
  const router = useRouter();

  const recoveryMessage = buildRecoveryMessage({
    hasTarget, isTargetMet, readinessScore, readinessLevel,
  });

  const canCreateTarget = !isGuest && !hasTarget && Boolean(examTypeId);
  const canCreatePlan = !isGuest && hasTarget && !isTargetMet;

  if (!recoveryMessage && !canCreateTarget && !canCreatePlan) return null;

  const handleGoToTarget = () => {
    const params = new URLSearchParams();
    if (examTypeId) params.set('examTypeId', String(examTypeId));
    router.push(`${routes.myTarget}?${params.toString()}`);
  };

  const handleGoToPlan = () => {
    const params = new URLSearchParams();
    if (userTestId) params.set('userTestId', userTestId);
    if (examTypeId) params.set('examTypeId', String(examTypeId));
    const qs = params.toString();
    router.push(qs ? `${routes.generatePlan}?${qs}` : routes.generatePlan);
  };

  return (
    <div className={cx('sectionContainer')}>
      <h3 className={cx('sectionTitle')} style={{ marginBottom: 4 }}>
        Việc cần làm ngay
      </h3>
      {recoveryMessage && (
        <p className={cx('recoveryMessage')}>{recoveryMessage}</p>
      )}
      {canCreateTarget && (
        <button
          type="button"
          className={cx('recoveryPlanCta', 'recoveryTargetCta')}
          onClick={handleGoToTarget}
        >
          Đặt mục tiêu
        </button>
      )}
      {canCreatePlan && (
        <button
          type="button"
          className={cx('recoveryPlanCta')}
          onClick={handleGoToPlan}
        >
          <IoCalendarOutline size={20} aria-hidden />
          Lập kế hoạch học
        </button>
      )}
    </div>
  );
}

export default RecoveryPlan;
