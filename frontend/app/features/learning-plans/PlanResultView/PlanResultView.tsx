'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import ReviewQuestionCard from '@/app/features/tests/Review/ReviewQuestionCard';
import ReviewFooterNav from '@/app/features/tests/Review/ReviewFooterNav';
import { QuestionType } from '@/app/enums';
import type { SessionReviewItem } from '@/app/types';
import type { PlanResultData } from '@/app/features/learning-plans/planResult';

const cx = classNames.bind(styles);

function selectedIdsOf(item: SessionReviewItem): string[] {
  if (item.questionType === QuestionType.MSQ) return item.selectedAnswerIds || [];
  return item.selectedAnswerId ? [item.selectedAnswerId] : [];
}

function itemStatus(item: SessionReviewItem): string {
  if (selectedIdsOf(item).length === 0) return 'unanswered';
  return item.isCorrect ? 'correct' : 'incorrect';
}

type PlanResultViewProps = {
  result?: PlanResultData | null;
  onRetry?: () => void;
  onPickAnother?: () => void;
  onNext?: () => void;
};

function PlanResultView({ result, onRetry, onPickAnother, onNext }: PlanResultViewProps) {
  const t = useTranslations('LearningPlans');
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
          <h2 className={cx('reviewTitle')}>{t('resultView.title')}</h2>
          <p className={cx('planReviewMeta')}>
            <span
              className={cx('planReviewStatus', {
                passed: result.passed,
                failed: !result.passed,
              })}
            >
              {result.passed ? t('resultView.passed') : t('resultView.failed')}
            </span>
            <span>
              {t('resultView.correct', { correct: correctCount, total: items.length })}
              {result.accuracy != null ? ` · ${result.accuracy}%` : ''}
            </span>
          </p>
        </div>
        <div className={cx('resultActions')}>
          {result.passed && onNext && (
            <ButtonPrime variant="primary" size="sm" onClick={onNext}>
              {t('resultView.next')} <ArrowRight size={16} />
            </ButtonPrime>
          )}
          <ButtonPrime variant={result.passed && onNext ? 'outline' : 'primary'} size="sm" onClick={onRetry}>
            {result.passed ? t('resultView.redo') : t('common.retry')}
          </ButtonPrime>
          <ButtonPrime variant="ghost" size="sm" onClick={onPickAnother}>
            {t('resultView.pickAnother')}
          </ButtonPrime>
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
