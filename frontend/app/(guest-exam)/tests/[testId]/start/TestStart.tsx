'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import classNames from 'classnames/bind';
import TestStateScreens from './_components/TestStateScreens';
import { useTestSession } from './_hooks/useTestSession';
import ExamLayoutRenderer from '@/app/components/exam-layout/ExamLayoutRenderer';
import StreakRestoreModal from '@/app/components/gamification/streak/StreakRestoreModal';
import BaseModal from '@/app/components/modal/BaseModal';
import styles from '@/app/components/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

const STATE_SCREEN_STATUSES = ['loading', 'ready', 'payment', 'no-attempts', 'locked', 'closed', 'error'];

function TestStart() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
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
  } = useTestSession();

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
        title="Nộp bài?"
        maxWidth={440}
        footer={
          <div className={cx('state-actions')}>
            <button
              type="button"
              className={cx('state-btn', 'state-btn-secondary')}
              onClick={closeConfirm}
            >
              Làm tiếp
            </button>
            <button
              type="button"
              className={cx('state-btn', 'state-btn-primary')}
              onClick={confirmSubmit}
            >
              Nộp bài
            </button>
          </div>
        }
      >
        <p className={cx('submit-confirm-text')}>
          {unansweredCount > 0 ? (
            <>
              Bạn còn{' '}
              <strong>
                {unansweredCount}/{allQuestions.length} câu
              </strong>{' '}
              chưa trả lời. Nộp rồi thì không sửa được nữa.
            </>
          ) : (
            <>
              Bạn đã trả lời hết {allQuestions.length} câu. Nộp rồi thì không
              sửa được nữa.
            </>
          )}
          {flaggedQuestionIds.length > 0 && (
            <>
              {' '}
              Còn <strong>{flaggedQuestionIds.length} câu</strong> bạn đã đánh dấu để xem lại.
            </>
          )}
        </p>
      </BaseModal>
    </>
  );
}

export default TestStart;
