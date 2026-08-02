
export function toPlanResult(data) {
  return {
    reviewItems: data.lastReviewItems,
    passed: !!data.passed,
    accuracy: data.accuracy ?? 0,
    correctCount: data.correctCount ?? 0,
    totalCount: data.totalCount ?? 0,
    message: data.message,
    planStage: data.planStage,
  };
}
