'use client';


import { useRouter } from 'next/navigation';
import TestStateScreens from './_components/TestStateScreens';
import { useTestSession } from './_hooks/useTestSession';
import ExamLayoutRenderer from '@/app/components/exam-layout/ExamLayoutRenderer';

const STATE_SCREEN_STATUSES = ['loading', 'payment', 'no-attempts', 'locked', 'closed'];

function TestStart() {
  const router = useRouter();
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
    handleSubmit,
    handlePurchase,
    isPaged,
    flowSteps,
    currentStepIndex,
    canGoPrev,
    goNext,
    goPrev,
    goToQuestion,
    canNavigateToQuestion,
  } = useTestSession();

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
      />
    );
  }

  return (
    <ExamLayoutRenderer
      config={layoutConfig}
      isPractice={isPractice}
      visibleParts={visibleParts}
      questionIndexMap={questionIndexMap}
      userAnswers={userAnswers}
      handleAnswerChange={handleAnswerChange}
      allQuestions={allQuestions}
      timeLeft={timeLeft}
      formatTime={formatTime}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      isPaged={isPaged}
      flowSteps={flowSteps}
      currentStepIndex={currentStepIndex}
      canGoPrev={canGoPrev}
      goNext={goNext}
      goPrev={goPrev}
      goToQuestion={goToQuestion}
      canNavigateToQuestion={canNavigateToQuestion}
    />
  );
}

export default TestStart;
