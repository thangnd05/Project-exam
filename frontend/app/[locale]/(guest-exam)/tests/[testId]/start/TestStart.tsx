'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useState } from 'react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import TestStateScreens from './_components/TestStateScreens';
import { useTestSession } from './_hooks/useTestSession';
import type { TestRef } from '@/app/features/tests/testRef';
import ExamLayoutRenderer from '@/app/features/exam-layout/ExamLayoutRenderer';
import StreakRestoreModal from '@/app/features/gamification/streak/StreakRestoreModal';
import BaseModal from '@/app/components/modal/BaseModal';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import styles from '@/app/features/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

const STATE_SCREEN_STATUSES = ['loading', 'ready', 'payment', 'no-attempts', 'locked', 'closed', 'error'];

// testRef do page server tra từ slug trên URL (/tests/aws-dop-c02-test-1/start) rồi truyền xuống.
function TestStart({ testRef }: { testRef: TestRef }) {
  const router = useRouter();
  const t = useTranslations('TestTaking.start');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const {
    isPractice,
    status,
    test,
    layoutConfig,
    userAnswers,
    timeLeft,
    preCountdown,
    isSubmitting,
    purchasing,
    balance,
    visibleParts,
    allQuestions,
    questionIndexMap,
    handleAnswerChange,
    flaggedQuestionIds,
    toggleFlag,
    handleSubmit,
    handlePurchase,
    retryLoad,
    confirmReady,
    isPaged,
    flowSteps,
    currentStepIndex,
    canGoPrev,
    goNext,
    goPrev,
    goToQuestion,
    canNavigateToQuestion,
    streakRestoreBlocked,
    allowStreakRestore,
    holdStart,
  } = useTestSession(testRef.testId);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if ((status === 'open' || status === 'active') && holdStart) {
    return (
      <>
        <TestStateScreens
          status="loading"
          test={test}
          balance={balance}
          purchasing={purchasing}
          preCountdown={preCountdown}
          formatTime={formatTime}
          onBack={() => router.back()}
          onPurchase={handlePurchase}
        />
        <StreakRestoreModal show={streakRestoreBlocked} onClose={allowStreakRestore} />
      </>
    );
  }

  if (STATE_SCREEN_STATUSES.includes(status)) {
    return (
      <TestStateScreens
        status={status}
        test={test}
        balance={balance}
        purchasing={purchasing}
        preCountdown={preCountdown}
        formatTime={formatTime}
        onBack={() => router.back()}
        onPurchase={handlePurchase}
        onRetry={retryLoad}
        questionCount={allQuestions.length}
        partCount={visibleParts.length}
        questionTypes={allQuestions.flatMap((q) => (q.questionType ? [q.questionType] : []))}
        onStart={confirmReady}
      />
    );
  }

  const unansweredCount = allQuestions.filter((q) => {
    const ans = userAnswers[q.questionId];
    return !(
      ans?.selectedAnswerId ||
      (ans?.selectedAnswerIds && ans.selectedAnswerIds.length > 0) ||
      ans?.answerText?.trim()
    );
  }).length;

  const closeConfirm = () => setConfirmOpen(false);
  const confirmSubmit = () => {
    setConfirmOpen(false);
    handleSubmit();
  };

  return (
    <>
      <ExamLayoutRenderer
        config={layoutConfig}
        isPractice={isPractice}
        title={test?.title}
        onExit={() => setExitOpen(true)}
        visibleParts={visibleParts}
        questionIndexMap={questionIndexMap}
        userAnswers={userAnswers}
        handleAnswerChange={handleAnswerChange}
        flaggedQuestionIds={flaggedQuestionIds}
        onToggleFlag={toggleFlag}
        allQuestions={allQuestions}
        timeLeft={timeLeft}
        formatTime={formatTime}
        isSubmitting={isSubmitting}
        handleSubmit={() => setConfirmOpen(true)}
        isPaged={isPaged}
        flowSteps={flowSteps}
        currentStepIndex={currentStepIndex}
        canGoPrev={canGoPrev}
        goNext={goNext}
        goPrev={goPrev}
        goToQuestion={goToQuestion}
        canNavigateToQuestion={canNavigateToQuestion}
      />
      <BaseModal
        show={confirmOpen}
        onClose={closeConfirm}
        title={t('confirmSubmit.title')}
        maxWidth={440}
        footer={
          <div className={cx('state-actions')}>
            <button
              type="button"
              className={cx('state-btn', 'state-btn-secondary')}
              onClick={closeConfirm}
            >
              {t('confirmSubmit.continue')}
            </button>
            <button
              type="button"
              className={cx('state-btn', 'state-btn-primary')}
              onClick={confirmSubmit}
            >
              {t('confirmSubmit.submit')}
            </button>
          </div>
        }
      >
        <p className={cx('submit-confirm-text')}>
          {unansweredCount > 0
            ? t.rich('confirmSubmit.unanswered', {
                unanswered: unansweredCount,
                total: allQuestions.length,
                strong: (chunks) => <strong>{chunks}</strong>,
              })
            : t('confirmSubmit.allAnswered', { total: allQuestions.length })}
          {flaggedQuestionIds.length > 0 && (
            <>
              {' '}
              {t.rich('confirmSubmit.flagged', {
                count: flaggedQuestionIds.length,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </>
          )}
        </p>
      </BaseModal>
      <ConfirmModal
        show={exitOpen}
        onClose={() => setExitOpen(false)}
        onConfirm={() => router.back()}
        title={t('confirmExit.title')}
        message={t('confirmExit.message')}
        confirmText={t('confirmExit.confirm')}
        cancelText={t('confirmExit.cancel')}
      />
    </>
  );
}

export default TestStart;
