'use client';

import { useMemo } from 'react';
import classNames from 'classnames/bind';
import styles from '@/app/features/diagnostic/styles/PersonalizedPlan.module.scss';
import ReviewQuestionCard from '@/app/components/Review/ReviewQuestionCard';
import ReviewFooterNav from '@/app/components/Review/ReviewFooterNav';
import { QuestionType } from '@/app/enums';
import type { SessionReviewItem } from '@/app/types';
import type { PlanResultData } from '@/app/utils/planResult';

const cx = classNames.bind(styles);

function selectedIdsOf(item: SessionReviewItem): string[] {
  if (item.questionType === QuestionType.MSQ) return item.selectedAnswerIds || [];
  return item.selectedAnswerId ? [item.selectedAnswerId] : [];
}

function itemStatus(item: SessionReviewItem): string {
  if (selectedIdsOf(item).length === 0) return 'unanswered';
  // TODO: BE serialize cờ đúng/sai là `correct` (Jackson bỏ tiền tố is), type SessionReviewItem
  // khai `isCorrect` — giữ nguyên field behavior của bản .js cũ, cast any có chủ đích.
  return (item as any).correct ? 'correct' : 'incorrect';
}

type PlanResultViewProps = {
  result?: PlanResultData | null;
  onRetry?: () => void;
  onPickAnother?: () => void;
};

function PlanResultView({ result, onRetry, onPickAnother }: PlanResultViewProps) {
  const items = useMemo(
    () =>
      (result?.reviewItems || []).map((item, idx) => ({
        ...item,
        id: item.questionId,
        number: idx + 1,
        status: itemStatus(item),
      })),
    [result?.reviewItems],
  );

  const correctCount = useMemo(
    () => items.filter((i) => i.status === 'correct').length,
    [items],
  );

  const scrollToQuestion = (questionId: string) => {
    const el = document.getElementById(`pr-${questionId}`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  if (!result) return null;

  return (
    <div className={cx('planReviewWithFooter')}>
      <div className={cx('planReviewTop')}>
        <div>
          <h2 className={cx('reviewTitle')}>Chi tiết bài làm</h2>
          <p className={cx('planReviewMeta')}>
            <span
              className={cx('planReviewStatus', {
                passed: result.passed,
                failed: !result.passed,
              })}
            >
              {result.passed ? 'Đã qua ải' : 'Chưa qua ải'}
            </span>
            <span>
              {correctCount}/{items.length} câu đúng
              {result.accuracy != null ? ` · ${result.accuracy}%` : ''}
            </span>
          </p>
        </div>
        <div className={cx('resultActions')}>
          <button type="button" className={cx('btn', 'btnPrimary', 'btnSm')} onClick={onRetry}>
            {result.passed ? 'Làm lại ải này' : 'Thử lại'}
          </button>
          <button
            type="button"
            className={cx('btn', 'btnOutline', 'btnSm')}
            onClick={onPickAnother}
          >
            Chọn ải khác
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className={cx('reviewPanel')}>
          {items.map((item) => (
            <ReviewQuestionCard
              key={item.questionId}
              id={`pr-${item.questionId}`}
              number={item.number}
              status={item.status}
              questionText={item.questionText}
              answers={item.answers || []}
              selectedAnswerIds={selectedIdsOf(item)}
              correctAnswerId={item.correctAnswerId}
              explanation={item.explanation}
            />
          ))}
        </div>
      )}

      <ReviewFooterNav
        items={items}
        correctCount={correctCount}
        onSelect={scrollToQuestion}
      />
    </div>
  );
}

export default PlanResultView;
