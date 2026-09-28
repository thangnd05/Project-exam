'use client';

import { useRouter } from 'next/navigation';
import { IoCalendarOutline} from 'react-icons/io5';
import classNames from 'classnames/bind';
import { buildRecoveryMessage } from '@/app/utils/readiness-label';
import { buildPlanFromTestUrl, buildGeneratePlanUrl } from '@/app/utils/planFromTest';
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

  const canSignUp = Boolean(isGuest && userTestId);

  if (!recoveryMessage && !canCreateTarget && !canCreatePlan && !canSignUp) return null;

  const handleGoToTarget = () => {
    router.push(buildPlanFromTestUrl({ userTestId, examTypeId, hasTarget: false }));
  };

  const handleGoToPlan = () => {
    router.push(buildGeneratePlanUrl(userTestId, examTypeId));
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
      {canSignUp && (
        <button
          type="button"
          className={cx('recoveryPlanCta')}
          onClick={() => router.push(buildPlanFromTestUrl({ userTestId, examTypeId, isGuest: true }))}
        >
          <IoCalendarOutline size={20} aria-hidden />
          Đăng ký để nhận lộ trình học
        </button>
      )}
      {canCreatePlan && (
        <button
          type="button"
          className={cx('recoveryPlanCta')}
          onClick={handleGoToPlan}
        >
          <IoCalendarOutline size={20} aria-hidden />
          Lập lộ trình học
        </button>
      )}
    </div>
  );
}

export default RecoveryPlan;
