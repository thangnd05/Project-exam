'use client';

import { useRouter } from '@/app/i18n/navigation';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { useTranslations } from 'next-intl';
import { buildPracticeRecoveryMessage, buildRecoveryMessage } from '@/app/features/my-target/readiness-label';
import type { PartBreakdownResponse } from '@/app/types';
import { buildPlanFromTestUrl, buildGeneratePlanUrl } from '@/app/[locale]/(guest)/attempts/[userTestId]/_lib/planFromTest';
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
  // Có giá trị khi là bài luyện theo phần: các Part đã luyện kèm % mục tiêu từng Part.
  practiceParts?: PartBreakdownResponse[] | null;
  // Khung chẩn đoán đã có nút chính (bài thử nhanh: làm đề đầy đủ) thì nút ở đây lùi xuống dạng viền.
  secondaryCta?: boolean;
};

function RecoveryPlan({
  userTestId,
  examTypeId,
  hasTarget,
  isTargetMet,
  readinessScore,
  readinessLevel,
  isGuest,
  practiceParts,
  secondaryCta = false,
}: RecoveryPlanProps) {
  const router = useRouter();
  const t = useTranslations('TestTaking.recoveryPlan');
  // readiness-label dịch theo namespace MyTarget; truyền translator để thông điệp theo ngôn ngữ đang xem.
  const tTarget = useTranslations('MyTarget');

  const practiceWithTarget = hasTarget && practiceParts ? practiceParts : null;
  const practiceResult = practiceWithTarget ? buildPracticeRecoveryMessage(practiceWithTarget, tTarget) : null;
  const recoveryMessage = practiceWithTarget
    ? practiceResult?.message ?? t('practiceNotCounted')
    : buildRecoveryMessage({ hasTarget, isTargetMet, readinessScore, readinessLevel, t: tTarget });

  const canCreateTarget = !isGuest && !hasTarget && Boolean(examTypeId);
  const canCreatePlan = !isGuest && hasTarget && (practiceWithTarget
    ? practiceResult?.allMet === false
    : !isTargetMet);

  const canSignUp = Boolean(isGuest && userTestId);

  if (!recoveryMessage && !canCreateTarget && !canCreatePlan && !canSignUp) return null;

  const ctaVariant = secondaryCta ? 'outline' : 'primary';

  const handleGoToTarget = () => {
    router.push(buildPlanFromTestUrl({ userTestId, examTypeId, hasTarget: false }));
  };

  const handleGoToPlan = () => {
    router.push(buildGeneratePlanUrl(userTestId, examTypeId));
  };

  return (
    <div className={cx('sectionContainer')}>
      <h3 className={cx('sectionTitle')} style={{ marginBottom: 4 }}>
        {t('title')}
      </h3>
      {recoveryMessage && (
        <p className={cx('recoveryMessage')}>{recoveryMessage}</p>
      )}
      {canCreateTarget && (
        <ButtonPrime variant={ctaVariant} size="lg" fullWidth onClick={handleGoToTarget}>
          {t('setTarget')}
        </ButtonPrime>
      )}
      {canSignUp && (
        <ButtonPrime
          variant={ctaVariant}
          size="lg"
          fullWidth
          onClick={() => router.push(buildPlanFromTestUrl({ userTestId, examTypeId, isGuest: true }))}
        >
          {t('signUpForPlan')}
        </ButtonPrime>
      )}
      {canCreatePlan && (
        <ButtonPrime variant={ctaVariant} size="lg" fullWidth onClick={handleGoToPlan}>
          {t('createPlan')}
        </ButtonPrime>
      )}
    </div>
  );
}

export default RecoveryPlan;
