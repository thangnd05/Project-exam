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
  const isAnsweredQuestion = (questionId: string) => {
    const ans = userAnswers[questionId];
    return (
      !!ans?.selectedAnswerId ||
      (Array.isArray(ans?.selectedAnswerIds) && ans.selectedAnswerIds.length > 0) ||
      !!ans?.answerText
    );
  };
  const total = allQuestions.length;
  const answeredCount = allQuestions.filter((q) => isAnsweredQuestion(q.questionId)).length;
  const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;
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
        <div className={cx('dashboard-top')}>
          <div className={cx('dashboard-header')}>
            <span>{t('title')}</span>
            <span className={cx('dashboard-progress')}>
              {answeredCount} / {total}
            </span>
          </div>
          <div className={cx('dashboard-legend')}>
            <div className={cx('status-item')}>
              <span className={cx('swatch', 'answered')} />
              <span>{t.rich('legendAnswered', { count: answeredCount, b: bold })}</span>
            </div>
            <div className={cx('status-item')}>
              <span className={cx('swatch')} />
              <span>{t.rich('legendUnanswered', { count: total - answeredCount, b: bold })}</span>
            </div>
            {flaggedQuestionIds && (
              <div className={cx('status-item')}>
                <span className={cx('swatch', 'flagged')} />
                <span>{t.rich('legendFlagged', { count: flaggedQuestionIds.length, b: bold })}</span>
              </div>
            )}
          </div>
        </div>
        <div className={cx('question-grid')} style={gridStyle}>
          {allQuestions.map((q, idx) => {
            const isAnswered = isAnsweredQuestion(q.questionId);

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
      </div>
    </div>
  );
}

export default TestStartDashboard;
