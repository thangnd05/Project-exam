'use client';

import Link from '@/app/i18n/navigation';
import classNamesBind from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { ArrowRight, ChevronRight } from 'lucide-react';
import ExamBadge from '@/app/[locale]/(public)/_components/ExamBadge/ExamBadge';
import { badgeUrl, parseCode } from '@/app/[locale]/(public)/_lib/certificationMeta';
import routes, { buildExamTypeDetailPath, buildTestPath } from '@/app/configs/Routes';
import { useExamTypeById } from '@/app/features/exam-types/hooks/useExamTypes';
import TestModeModal from '@/app/features/tests/TestModeModal/TestModeModal';
import { useTestStart } from '@/app/features/tests/TestCard/hooks/useTestStart';
import type { TestRef } from '@/app/features/tests/testRef';
import type { TestResponse } from '@/app/types';
import styles from './TestPage.module.scss';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

const cx = classNamesBind.bind(styles);

type TestPageTab = 'history' | 'leaderboard';

const TABS: { key: TestPageTab; labelKey: 'tabs.history' | 'tabs.leaderboard' }[] = [
  { key: 'history', labelKey: 'tabs.history' },
  { key: 'leaderboard', labelKey: 'tabs.leaderboard' },
];

const countQuestions = (test: TestResponse) =>
  (test.parts ?? []).reduce(
    (sum, part) =>
      sum + (part.questionGroups ?? []).reduce((n, group) => n + (group.questions?.length ?? 0), 0),
    0,
  );

function StartButton({ test }: { test: TestResponse }) {
  const t = useTranslations('TestTaking.pageHeader');
  const { canStart, buttonText, handleStart, modeModal } = useTestStart(test);
  return (
    <>
      <ButtonPrime variant="ink" type="button" onClick={handleStart} disabled={!canStart}>
        {canStart ? ((test.attemptsUsed ?? 0) > 0 ? t('retake') : t('start')) : buttonText}
        {canStart && <ArrowRight size="1em" aria-hidden="true" />}
      </ButtonPrime>
      <TestModeModal
        show={modeModal.show}
        test={test}
        onClose={modeModal.onClose}
        onStart={modeModal.onStart}
      />
    </>
  );
}

type TestPageHeaderProps = {
  testRef: TestRef;
  test: TestResponse | null;
  active: TestPageTab;
};

// Đầu trang chung của lịch sử và bảng xếp hạng một đề: đường dẫn, kỳ thi, tên đề, nút làm bài, tab.
function TestPageHeader({ testRef, test, active }: TestPageHeaderProps) {
  const t = useTranslations('TestTaking.pageHeader');
  const { examType } = useExamTypeById(test?.examTypeId);
  const examName = examType?.name?.trim() ?? '';
  const code = parseCode(examName);
  const title = test?.title || t('fallbackTitle');
  const questions = test ? countQuestions(test) : 0;

  // Bảng xếp hạng chỉ mở khi đề không giới hạn hạn nộp hoặc đã hết hạn (cùng điều kiện ở thẻ đề).
  const leaderboardOpen =
    !test?.availableTo || new Date() > new Date(test.availableTo) || active === 'leaderboard';

  const meta = test
    ? [
        questions > 0 ? t('meta.questions', { count: questions }) : null,
        test.durationMinutes != null
          ? t('meta.minutes', { count: test.durationMinutes })
          : t('meta.unlimited'),
        test.maxAttempts != null && test.remainingAttempts != null
          ? t('meta.attemptsLeft', { remaining: test.remainingAttempts, max: test.maxAttempts })
          : null,
      ].filter(Boolean)
    : [];

  return (
    <>
      <nav className={cx('breadcrumb')} aria-label={t('breadcrumbLabel')}>
        <Link href={routes.examTypes}>{t('examLibrary')}</Link>
        {examType && (
          <>
            <ChevronRight size="1em" aria-hidden="true" />
            <Link href={buildExamTypeDetailPath(examType)}>{code || examName}</Link>
          </>
        )}
        <ChevronRight size="1em" aria-hidden="true" />
        <span aria-current="page">{title}</span>
      </nav>

      <header className={cx('head')}>
        <div className={cx('headMain')}>
          <ExamBadge
            key={examType?.examTypeId ?? 'none'}
            sources={[badgeUrl(examName, code), examType?.imageUrl]}
            name={code || title}
            size={56}
          />
          <div className={cx('headText')}>
            {code && <span className={cx('code')}>{code}</span>}
            <h1 className={cx('title')}>{title}</h1>
            {meta.length > 0 && (
              <div className={cx('meta')}>
                {meta.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
          </div>
          {test && (
            <div className={cx('headActions')}>
              <StartButton test={test} />
            </div>
          )}
        </div>

        <nav className={cx('tabs')} aria-label={t('tabsLabel')}>
          {TABS.filter((tab) => tab.key !== 'leaderboard' || leaderboardOpen).map((tab) => (
            <Link
              key={tab.key}
              href={buildTestPath(testRef, tab.key)}
              className={cx('tab', { active: tab.key === active })}
              aria-current={tab.key === active ? 'page' : undefined}
            >
              {t(tab.labelKey)}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}

export default TestPageHeader;
