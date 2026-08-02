import { useNavigate } from 'react-router-dom';

import TestStateScreens from './TestStateScreens';
import { useTestSession } from '~/features/tests/exam/exam-types/detail/testStart/hooks/useTestSession';
import ExamLayoutRenderer from '~/features/tests/exam/exam-types/detail/testStart/examLayout/ExamLayoutRenderer';

const STATE_SCREEN_STATUSES = ['loading', 'payment', 'no-attempts', 'locked', 'closed'];

function TestStartPage() {
  const navigate = useNavigate();
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

  const formatTime = (seconds) => {
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
        onBack={() => navigate(-1)}
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

export default TestStartPage;
