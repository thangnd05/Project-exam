'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import type { QuestionResponse } from '@/app/types';
import styles from '@/app/features/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

export type DashboardAnswer = {
  selectedAnswerId?: string | string[] | null;
  selectedAnswerIds?: string[] | null;
  answerText?: string | null;
};

type TestStartDashboardProps = {
  allQuestions: QuestionResponse[];
  userAnswers: Record<string, DashboardAnswer | undefined>;
  onScrollToQuestion: (questionId: string) => void;
  columns?: number | null;
  isPaged?: boolean;
  canNavigateToQuestion?: ((questionId: string) => boolean) | null;
  currentQuestionIds?: Set<string> | null;
  flaggedQuestionIds?: string[] | null;
  gridMaxHeight?: string | number | null;
};

function TestStartDashboard({
  allQuestions,
  userAnswers,
  onScrollToQuestion,
  columns,
  isPaged = false,
  canNavigateToQuestion,
  currentQuestionIds = null,
  flaggedQuestionIds = null,
  gridMaxHeight = null,
}: TestStartDashboardProps) {
  const t = useTranslations('TestTaking.dashboard');
  const flaggedSet = new Set(flaggedQuestionIds ?? []);
  const gridStyle: React.CSSProperties | undefined =
    columns || gridMaxHeight
      ? {
          ...(columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {}),
          ...(gridMaxHeight ? { maxHeight: gridMaxHeight, overflowY: 'auto' as const } : {}),
        }
      : undefined;
  return (
    <div className={cx('dashboard')}>
      <div className={cx('dashboard-card')}>
        <div className={cx('dashboard-header')}>
          <span>{t('title')}</span>
        </div>
        <div className={cx('question-grid')} style={gridStyle}>
          {allQuestions.map((q, idx) => {
            const isAnswered =
              !!userAnswers[q.questionId]?.selectedAnswerId ||
              (Array.isArray(userAnswers[q.questionId]?.selectedAnswerIds) &&
                userAnswers[q.questionId]!.selectedAnswerIds!.length > 0) ||
              !!userAnswers[q.questionId]?.answerText;

            const locked =
              isPaged && typeof canNavigateToQuestion === 'function'
                ? !canNavigateToQuestion(q.questionId)
                : false;
            const isCurrent = currentQuestionIds ? currentQuestionIds.has(q.questionId) : false;
            const isFlagged = flaggedSet.has(q.questionId);
            return (
              <button
                key={q.questionId}
                type="button"
                className={cx('q-nav-item', {
                  answered: isAnswered,
                  current: isCurrent,
                  flagged: isFlagged,
                  locked,
                })}
                onClick={() => !locked && onScrollToQuestion(q.questionId)}
                disabled={locked}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={`${t('questionLabel', { number: idx + 1 })}${isAnswered ? t('ariaAnswered') : ''}${isFlagged ? t('ariaFlagged') : ''}${locked ? t('ariaLocked') : ''}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <div className={cx('dashboard-footer')}>
          <div className={cx('status-item')}>
            <span className={cx('dot', 'answered')} />
            <span>{t('answered')}</span>
          </div>
          <div className={cx('status-item')}>
            <span className={cx('dot')} />
            <span>{t('unanswered')}</span>
          </div>
          {flaggedQuestionIds && (
            <div className={cx('status-item')}>
              <span className={cx('dot', 'flagged')} />
              <span>{t('flagged', { count: flaggedQuestionIds.length })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestStartDashboard;
