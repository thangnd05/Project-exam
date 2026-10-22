'use client';

import Link from 'next/link';
import classNamesBind from 'classnames/bind';
import { FiArrowRight, FiChevronRight } from 'react-icons/fi';
import ExamBadge from '@/app/(public)/_components/ExamBadge/ExamBadge';
import { badgeUrl, parseCode } from '@/app/(public)/_lib/certificationMeta';
import routes, { buildExamTypeDetailPath, buildTestPath } from '@/app/configs/Routes';
import { useExamTypeById } from '@/app/features/exam-types/hooks/useExamTypes';
import TestModeModal from '@/app/features/tests/TestModeModal/TestModeModal';
import { useTestStart } from '@/app/features/tests/TestCard/hooks/useTestStart';
import type { TestRef } from '@/app/features/tests/testRef';
import type { TestResponse } from '@/app/types';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import styles from './TestPage.module.scss';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);

type TestPageTab = 'history' | 'leaderboard';

const TABS: { key: TestPageTab; label: string }[] = [
  { key: 'history', label: 'Lịch sử làm bài' },
  { key: 'leaderboard', label: 'Bảng xếp hạng' },
];

const countQuestions = (test: TestResponse) =>
  (test.parts ?? []).reduce(
    (sum, part) =>
      sum + (part.questionGroups ?? []).reduce((n, group) => n + (group.questions?.length ?? 0), 0),
    0,
  );

function StartButton({ test }: { test: TestResponse }) {
  const { canStart, buttonText, handleStart, modeModal } = useTestStart(test);
  return (
    <>
      <button type="button" className={ui('btnPrimary')} onClick={handleStart} disabled={!canStart}>
        {canStart ? ((test.attemptsUsed ?? 0) > 0 ? 'Làm lại' : 'Bắt đầu làm bài') : buttonText}
        {canStart && <FiArrowRight aria-hidden="true" />}
      </button>
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
  const { examType } = useExamTypeById(test?.examTypeId);
  const examName = examType?.name?.trim() ?? '';
  const code = parseCode(examName);
  const title = test?.title || 'Đề thi';
  const questions = test ? countQuestions(test) : 0;

  // Bảng xếp hạng chỉ mở khi đề không giới hạn hạn nộp hoặc đã hết hạn (cùng điều kiện ở thẻ đề).
  const leaderboardOpen =
    !test?.availableTo || new Date() > new Date(test.availableTo) || active === 'leaderboard';

  const meta = test
    ? [
        questions > 0 ? `${questions} câu` : null,
        test.durationMinutes != null ? `${test.durationMinutes} phút` : 'Không giới hạn giờ',
        test.maxAttempts != null && test.remainingAttempts != null
          ? `Còn ${test.remainingAttempts}/${test.maxAttempts} lượt`
          : null,
      ].filter(Boolean)
    : [];

  return (
    <>
      <nav className={cx('breadcrumb')} aria-label="Đường dẫn">
        <Link href={routes.examTypes}>Kho đề thi</Link>
        {examType && (
          <>
            <FiChevronRight aria-hidden="true" />
            <Link href={buildExamTypeDetailPath(examType)}>{code || examName}</Link>
          </>
        )}
        <FiChevronRight aria-hidden="true" />
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

        <nav className={cx('tabs')} aria-label="Trang của đề">
          {TABS.filter((tab) => tab.key !== 'leaderboard' || leaderboardOpen).map((tab) => (
            <Link
              key={tab.key}
              href={buildTestPath(testRef, tab.key)}
              className={cx('tab', { active: tab.key === active })}
              aria-current={tab.key === active ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}

export default TestPageHeader;
