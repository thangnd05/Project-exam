'use client';

import Link from '@/app/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { formatDateTime } from '@/app/utils/format-date-time';
import { useTargetAchieved } from '@/app/features/my-target/hooks/useTargetAchieved';
import { examTypeIdFromParams, useNormalizeExamParam, withExam } from '@/app/features/exam-types/hooks/useExamParam';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import { planCompareHref } from '@/app/features/learning-plans/planCompare';

const cx = classNames.bind(styles);

function TargetAchieved() {
  const t = useTranslations('MyTarget');
  const tCommon = useTranslations('Common');
  const searchParams = useSearchParams();
  // ?exam=<slug> chỉ dịch ra id khi danh sách kỳ thi tải xong, nên bắt đầu rỗng rồi chọn ngay khi danh sách về (xem bên dưới).
  const [examTypeId, setExamTypeId] = useState('');

  const { examTypes, target, latestMock, enhanced, isLoading: loading, error } =
    useTargetAchieved(examTypeId);

  useNormalizeExamParam(examTypes);

  // Danh sách kỳ thi về thì chọn kỳ thi theo ?exam= hoặc kỳ đầu tiên (điều chỉnh state ngay khi render).
  if (!examTypeId && examTypes.length > 0) {
    setExamTypeId(examTypeIdFromParams(searchParams, examTypes) || examTypes[0].examTypeId);
  }

  const enhancedMatches =
    enhanced && (!enhanced.examTypeId || enhanced.examTypeId === examTypeId);
  const isAchieved = Boolean(target?.achievedAt)
    || (enhancedMatches && enhanced?.isTargetMet === true);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <ButtonPrime as="link" href="/my-target/dashboard" variant="ghost" size="sm">
          {t('achieved.back')}
        </ButtonPrime>
      </div>

      <div className={cx('filterRow')}>
        <div className={cx('fieldGroup')}>
          <label className={cx('fieldLabel')}>{t('achieved.examType')}</label>
          <select
            className={cx('select')}
            value={examTypeId}
            onChange={(e) => setExamTypeId(e.target.value)}
          >
            {examTypes.map((et) => (
              <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>{tCommon('loading')}</div>}

      {!loading && !target?.hasTarget && (
        <div className={cx('alert', 'alertInfo')}>
          <span>{t('achieved.noTarget')}</span>
          <ButtonPrime as="link" href={withExam('/my-target', examTypeId, examTypes)} variant="primary" size="sm">
            {t('achieved.setTarget')}
          </ButtonPrime>
        </div>
      )}

      {!loading && target?.hasTarget && !isAchieved && (
        <div className={cx('alert', 'alertWarning')}>
          <span>
            {t('achieved.notMet', { score: target.targetScore ?? 0 })}{' '}
            {enhanced?.totalScore != null && (
              <>{t.rich('achieved.latestScore', {
                score: enhanced.totalScore,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</>
            )}
          </span>
          <ButtonPrime
            as="link"
            href={withExam('/my-target/dashboard', examTypeId, examTypes)}
            variant="outline"
            size="sm"
          >
            {t('achieved.viewProgress')}
          </ButtonPrime>
        </div>
      )}

      {!loading && isAchieved && target && (
        <>
          <div className={cx('hero')}>
            <h1 className={cx('heroTitle')}>{t('achieved.heroTitle')}</h1>
            <p className={cx('heroSubtitle')}>
              {t.rich('achieved.heroTarget', {
                score: target.targetScore ?? '',
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
              {enhancedMatches && enhanced?.totalScore != null && target.targetScore != null && (
                <>
                  {' · '}
                  {t.rich('achieved.heroScore', {
                    score: enhanced.totalScore,
                    diff: enhanced.totalScore - target.targetScore,
                    strong: (chunks) => <strong className={cx('successText')}>{chunks}</strong>,
                  })}
                </>
              )}
            </p>
            <p className={cx('heroMeta')}>
              {target.achievedAt
                ? <>{t('achieved.achievedAt', { date: formatDateTime(target.achievedAt) })}</>
                : <>{t('achieved.mockAchieved', { date: formatDateTime(latestMock?.finishedAt) })}</>}
            </p>
          </div>

          <div className={cx('card')}>
            <div className={cx('cardHeader')}>{t('achieved.nextTarget.title')}</div>
            <div className={cx('cardBody')}>
              {/* Mục tiêu do người dùng tự đặt nên không gợi ý mức điểm. */}
              <p className={cx('muted')} style={{ marginBottom: '1.6rem' }}>
                {t.rich('achieved.nextTarget.description', {
                  score: target.targetScore ?? '',
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <ButtonPrime
                as="link"
                href={withExam('/my-target', examTypeId, examTypes)}
                variant="outline"
                size="sm"
              >
                {t('achieved.nextTarget.cta')}
              </ButtonPrime>
            </div>
          </div>

          <div className={cx('card')}>
            <div className={cx('cardHeader')}>{t('achieved.next.title')}</div>
            <div className={cx('cardBody')}>
              <ul style={{ paddingLeft: '2rem', margin: 0, fontSize: 'var(--font-size-ssm)' }}>
                <li>
                  <Link href={withExam('/my-target', examTypeId, examTypes)}>{t('achieved.next.newTarget')}</Link>
                  {' '}- {t('achieved.next.newTargetDesc')}
                </li>
                <li>
                  <Link href={planCompareHref(examTypeId, examTypes)}>
                    {t('achieved.next.journey')}
                  </Link>
                  {' '}- {t('achieved.next.journeyDesc')}
                </li>
                <li>
                  <Link href={withExam('/my-target/dashboard', examTypeId, examTypes)}>
                    {t('achieved.next.overview')}
                  </Link>
                  {' '}- {t('achieved.next.overviewDesc')}
                </li>
                <li>
                  <Link href="/">{t('achieved.next.practice')}</Link>
                  {' '}- {t('achieved.next.practiceDesc')}
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TargetAchieved;
