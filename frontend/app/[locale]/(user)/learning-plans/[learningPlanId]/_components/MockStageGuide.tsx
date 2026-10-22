'use client';

import Link from '@/app/i18n/navigation';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import { getMyCompletedUserTests } from '@/app/apis/userTestApi';
import { buildExamTypeDetailPath } from '@/app/configs/Routes';
import { isPracticeAttempt } from '@/app/features/learning-plans/planLabels';
import type { PlanResponse, UserTestResponse } from '@/app/types';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import {completedUserTestKeys} from '@/app/configs/queryKeys';

const cx = classNames.bind(styles);

function findFreshMock(tests: UserTestResponse[] | undefined, plan: PlanResponse): UserTestResponse | null {
  const planCreatedAt = plan.createdAt ? new Date(plan.createdAt).getTime() : 0;
  const candidates = (tests || []).filter((t) => {
    if (!t.finishedAt || t.userTestId === plan.sourceUserTestId) return false;
    return new Date(t.finishedAt).getTime() > planCreatedAt;
  });
  return candidates.find((t) => !isPracticeAttempt(t)) || candidates[0] || null;
}

type MockStageGuideProps = {
  plan: PlanResponse;
};

function MockStageGuide({ plan }: MockStageGuideProps) {
  const t = useTranslations('LearningPlans');
  const testsQuery = useQuery({
    queryKey: completedUserTestKeys.byExamType(plan.examTypeId),
    queryFn: () => getMyCompletedUserTests(plan.examTypeId),
    enabled: !!plan.examTypeId,
  });

  const freshMock = findFreshMock(testsQuery.data, plan);
  const mockTestsTo = buildExamTypeDetailPath(plan.examTypeId);
  const generateTo = freshMock
    ? `/learning-plans/generate?userTestId=${freshMock.userTestId}&examTypeId=${plan.examTypeId}`
    : `/learning-plans/generate?examTypeId=${plan.examTypeId}`;

  return (
    <div className={cx('card')}>
      <div className={cx('cardBody')}>
        <h3 className={cx('sectionTitle')} style={{ marginBottom: 4 }}>
          {t('mockGuide.heading')}
        </h3>
        <p className={cx('muted')} style={{ marginBottom: '1.2rem' }}>
          {t('mockGuide.intro')}
        </p>

        <div className={cx('stepsGuide')}>
          <div className={cx('stepItem')}>
            <span className={cx('stepNum')}>1</span>
            <div>
              <div className={cx('stepTitle')}>{t('mockGuide.step1Title')}</div>
              <div className={cx('stepDesc')}>
                {t('mockGuide.step1Desc')}
              </div>
              {!freshMock && (
                <Link
                  href={mockTestsTo}
                  className={cx('btn', 'btnPrimary', 'btnSm')}
                  style={{ marginTop: 8 }}
                >
                  {t('mockGuide.chooseMock')}
                </Link>
              )}
            </div>
          </div>
          <div className={cx('stepItem')}>
            <span className={cx('stepNum')}>2</span>
            <div>
              <div className={cx('stepTitle')}>{t('mockGuide.step2Title')}</div>
              <div className={cx('stepDesc')}>
                {t('mockGuide.step2Desc')}
              </div>
            </div>
          </div>
        </div>

        {freshMock ? (
          <div className={cx('alert', 'alertSuccess')} style={{ marginTop: '1.2rem' }}>
            <span>
              {t('mockGuide.freshMock')}{' '}
              <strong>
                {freshMock.testTitle ? `${freshMock.testTitle}  ` : ''}
                {formatDate(freshMock.finishedAt)}
                {freshMock.totalScore != null ? ` · ${t('mockGuide.score', { score: freshMock.totalScore })}` : ''}
              </strong>
              {isPracticeAttempt(freshMock) && (
                <>
                  {' '}
                  <small>{t('mockGuide.practiceNote')}</small>
                </>
              )}
            </span>
            <Link href={generateTo} className={cx('btn', 'btnPrimary', 'btnSm')}>
              {t('mockGuide.generateFromThis')}
            </Link>
          </div>
        ) : (
          <p className={cx('muted')} style={{ marginTop: '1.2rem', marginBottom: 0 }}>
            {t.rich('mockGuide.afterSubmit', { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
        )}
      </div>
    </div>
  );
}

export default MockStageGuide;
